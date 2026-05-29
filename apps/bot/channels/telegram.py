"""
Telegram channel handler.

Converts Telegram updates into brain.run() calls and sends replies.
"""
from __future__ import annotations

import asyncio
import logging
import os
from io import BytesIO

import httpx

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

from agent import run, ConvState
from storage import (
    check_rate_limit,
    clear_conversation,
    load_conversation,
    save_conversation,
    upload_staging_photo,
)
from transcribe import transcribe_voice

logger = logging.getLogger(__name__)

WEB_APP_URL = os.environ.get("WEB_APP_URL", "http://localhost:3001")
INTERNAL_TOKEN = os.environ.get("INTERNAL_API_TOKEN", "")
ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "")
SIM_MODE = os.environ.get("SIMULATION_MODE", "").lower() in ("1", "true", "yes")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _warmup_ml() -> None:
    if not ML_SERVICE_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.get(f"{ML_SERVICE_URL}/health")
    except Exception:
        pass


async def _get_state(telegram_id: int) -> ConvState:
    raw = await load_conversation(telegram_id)
    return ConvState.from_json(raw)


async def _save_state(telegram_id: int, state: ConvState) -> None:
    await save_conversation(telegram_id, state.to_json(), locale=state.locale)


async def _reply(update: Update, text: str) -> None:
    """Send a message, using Markdown if the text contains it."""
    if update.message:
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


async def _run_brain(update: Update, state: ConvState, text: str) -> None:
    """Run the brain and send the reply. Handles typing indicator."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    if update.message:
        await update.message.chat.send_action(ChatAction.TYPING)

    try:
        reply, updated_state = await run(
            state=state,
            new_text=text,
            web_app_url=WEB_APP_URL,
            internal_token=INTERNAL_TOKEN,
        )
    except Exception:
        logger.exception("Brain error for user %s", telegram_id)
        await _reply(update, "Algo correu mal 😔 Por favor tente novamente ou contacte-nos.")
        return

    await _save_state(telegram_id, updated_state)

    if reply:
        await _reply(update, reply)

    # If a case was just created, send the confirmation block
    if updated_state.created_case_slug and state.created_case_slug != updated_state.created_case_slug:
        slug = updated_state.created_case_slug
        case_url = f"{WEB_APP_URL}/caso/{slug}"
        poster_url = f"{WEB_APP_URL}/api/cases/{slug}/poster?locale={updated_state.locale}"
        confirmation = (
            f"✅ *Caso criado com sucesso!*\n\n"
            f"🔗 {case_url}\n"
            f"📄 [Poster para imprimir]({poster_url})\n"
            f"📢 A publicar em grupos Facebook do Algarve...\n"
            f"🔍 A verificar coincidências na base de dados...\n\n"
            f"Envie-me mensagem quando tiver novidades. Não perca a esperança 💙"
        )
        await _reply(update, confirmation)


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # WS2: deep-link handoff. t.me/<bot>?start=<owner_token> arrives as context.args[0].
    if context.args:
        handled = await _handle_handoff(update, context, str(context.args[0]).strip())
        if handled:
            return  # claimed + first step sent; skip the generic welcome

    keyboard = [
        [
            InlineKeyboardButton("🐕 Perdi o meu cão", callback_data="flow_perdido"),
            InlineKeyboardButton("🐾 Encontrei um cão", callback_data="flow_encontrado"),
        ],
        [InlineKeyboardButton("👁 Vi um cão de um caso", callback_data="flow_avistamento")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    welcome = (
        "Olá! Sou o assistente do *SalvaCão* 🐾\n\n"
        "Estou aqui para ajudar com cães perdidos e encontrados no Algarve.\n\n"
        "O que aconteceu?"
    )
    if update.message:
        await update.message.reply_text(welcome, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)


# ---------------------------------------------------------------------------
# WS2/WS3 — Web→Telegram handoff: claim case, deliver guided steps one at a time
# ---------------------------------------------------------------------------

def _step_keyboard(idx: int) -> InlineKeyboardMarkup:
    # callback_data must be ≤64 bytes — no slug here (the chat is already bound to
    # the case via ConvState.created_case_slug, resolved in the callback handler).
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("Feito ✓", callback_data=f"step:{idx}:done"),
        InlineKeyboardButton("Agora não", callback_data=f"step:{idx}:later"),
    ]])


async def _send_step(bot, chat_id: int, steps: list[dict], idx: int) -> None:
    """Send ONE guided step. WAIT steps carry no advance button — they're the rest state."""
    if idx >= len(steps):
        await bot.send_message(
            chat_id=chat_id,
            text="Concluíste o protocolo das primeiras horas. 🐾\n"
                 "A Nona continua a vigiar o caso e avisa-te assim que houver novidade.",
        )
        return
    step = steps[idx]
    n = len(steps)
    if step.get("kind") == "wait":
        why = step.get("why")
        text = f"⏳ {step['title']}"
        if why:
            text += f"\n\n_{why}_"
        await bot.send_message(chat_id=chat_id, text=text, parse_mode=ParseMode.MARKDOWN)
        return
    text = f"*Ação {idx + 1} de {n}*\n\n{step['title']}"
    await bot.send_message(
        chat_id=chat_id, text=text,
        reply_markup=_step_keyboard(idx), parse_mode=ParseMode.MARKDOWN,
    )


def _load_guided_flow(db, slug: str) -> tuple[dict, list[dict], int]:
    """Fetch case + rebuild the step sequence from the BUCKET PINNED AT CLAIM TIME.
    Critical: we do NOT recompute the bucket from now() — otherwise an owner who
    crosses a time boundary mid-flow (e.g. starts at h5, presses Feito at h7) would
    get a different protocol's step list and the button idx would point at the wrong
    step. The bucket is pinned in guided_flow.bucket when the flow starts."""
    from agent.pi_tools import build_step_sequence, bucket_from_hours, sequence_for_case
    from datetime import datetime, timezone
    res = (
        db.table("cases")
        .select("id, slug, last_seen_at, behavioral_profile")
        .eq("slug", slug)
        .maybe_single()
        .execute()
    )
    case = dict(res.data or {})
    bp = case.get("behavioral_profile") or {}
    gf = bp.get("guided_flow") or {}
    pinned_bucket = gf.get("bucket")
    if pinned_bucket:
        steps = build_step_sequence(str(pinned_bucket), bool(gf.get("is_hard", False)))
    else:
        # No pinned bucket (legacy / direct dashboard start) → derive once from elapsed.
        last_seen = case.get("last_seen_at")
        hours = 0.0
        if last_seen:
            try:
                dt = datetime.fromisoformat(str(last_seen).replace("Z", "+00:00"))
                hours = max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0)
            except (ValueError, TypeError):
                hours = 0.0
        steps = sequence_for_case(case, hours)
    idx = int(gf.get("step_index", 0))
    return case, steps, idx


def _save_step_index(
    db, case_id: str, behavioral_profile: dict, idx: int,
    mark_done: int | None = None, bucket: str | None = None, is_hard: bool | None = None,
) -> None:
    bp = dict(behavioral_profile or {})
    gf = dict(bp.get("guided_flow") or {})
    completed = list(gf.get("completed") or [])
    if mark_done is not None and mark_done not in completed:
        completed.append(mark_done)
    gf["step_index"] = idx
    gf["completed"] = completed
    # Pin the bucket/is_hard the first time so callbacks never recompute from now().
    if bucket is not None:
        gf["bucket"] = bucket
    if is_hard is not None:
        gf["is_hard"] = is_hard
    if "started_at" not in gf:
        from datetime import datetime, timezone
        gf["started_at"] = datetime.now(timezone.utc).isoformat()
    bp["guided_flow"] = gf
    db.table("cases").update({"behavioral_profile": bp}).eq("id", case_id).execute()


async def _handle_handoff(update: Update, context: ContextTypes.DEFAULT_TYPE, owner_token: str) -> bool:
    """Claim a web-created case via owner_token, greet as case officer, send step 0.
    Returns True if handled (so cmd_start skips the generic welcome)."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{WEB_APP_URL}/api/bot/cases/claim",
                json={"owner_token": owner_token, "telegram_id": str(telegram_id)},
                headers={"x-internal-token": INTERNAL_TOKEN},
            )
    except Exception:
        logger.exception("handoff claim request failed")
        return False

    if resp.status_code != 200:
        logger.info("handoff claim rejected: %s", resp.status_code)
        return False

    data = resp.json().get("data", {})
    slug = data.get("slug")
    if not slug:
        return False

    # Bind telegram_id + slug into conversation state so the chat knows the case.
    state_dict = await load_conversation(telegram_id)
    state = ConvState.from_json(state_dict)
    state.telegram_id = telegram_id
    state.created_case_slug = slug
    await save_conversation(telegram_id, state.to_json(), state.locale)

    dog = data.get("dog_name") or "o teu cão"
    zone = data.get("zone") or data.get("municipality") or "a zona"
    greeting = (
        f"Sou a *Nona*, e a partir de agora trato do caso do *{dog}* contigo. 💙\n\n"
        f"Já estou a montar a tua rede local em {zone}. "
        f"Vou guiar-te passo a passo — uma ação de cada vez, ao teu ritmo.\n\n"
        f"A maioria dos cães está perto, escondida. Com calma e método, maximizamos "
        f"a probabilidade de o trazer de volta."
    )
    if update.message:
        await update.message.reply_text(greeting, parse_mode=ParseMode.MARKDOWN)

    # Build the sequence from claim data (bot is source of truth for order).
    from agent.pi_tools import build_step_sequence, bucket_from_hours
    bucket = bucket_from_hours(float(data.get("hours_elapsed", 0) or 0))
    is_hard = bool(data.get("is_hard", False))
    steps = build_step_sequence(bucket, is_hard)

    # Pin bucket + is_hard so callbacks never recompute from now() (boundary-cross bug).
    try:
        from storage import get_supabase
        db = get_supabase()
        case = (
            db.table("cases").select("id, behavioral_profile").eq("slug", slug).maybe_single().execute()
        )
        if case.data:
            _save_step_index(
                db, case.data["id"], case.data.get("behavioral_profile") or {}, 0,
                bucket=bucket, is_hard=is_hard,
            )
    except Exception:
        logger.exception("handoff: failed to init guided_flow")

    if update.message:
        await _send_step(context.bot, update.message.chat_id, steps, 0)
    return True


async def handle_step_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """WS3: advance the guided step sequence on [Feito ✓] / [Agora não]."""
    query = update.callback_query
    if not query:
        return
    await query.answer()

    # callback_data = step:<idx>:done|later  (slug resolved from ConvState)
    parts = (query.data or "").split(":")
    if len(parts) != 3:
        return
    _, idx_str, verb = parts
    try:
        idx = int(idx_str)
    except ValueError:
        return

    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    state = ConvState.from_json(await load_conversation(telegram_id))
    slug = state.created_case_slug
    if not slug:
        await context.bot.send_message(
            chat_id=query.message.chat_id,  # type: ignore[union-attr]
            text="Não encontrei o caso associado a esta conversa. Usa o link do teu caso para recomeçar.",
        )
        return

    if verb == "later":
        await context.bot.send_message(
            chat_id=query.message.chat_id,  # type: ignore[union-attr]
            text="Sem pressa. Quando fizeres, toca em *Feito ✓*.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    # done → mark ✓, advance, send next
    try:
        from storage import get_supabase
        db = get_supabase()
        case, steps, _cur = _load_guided_flow(db, slug)
        next_idx = idx + 1
        if case.get("id"):
            _save_step_index(db, case["id"], case.get("behavioral_profile") or {}, next_idx, mark_done=idx)
        done_title = steps[idx]["title"] if idx < len(steps) else ""
        try:
            await query.edit_message_text(f"✓ {done_title}")
        except Exception:
            pass
        await _send_step(context.bot, query.message.chat_id, steps, next_idx)  # type: ignore[union-attr]
    except Exception:
        logger.exception("step callback failed for slug %s", slug)


async def cmd_cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    await clear_conversation(telegram_id)
    await _reply(update, "Conversa cancelada. Quando quiser, pode começar de novo com /start.")


async def cmd_ajuda(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    help_text = (
        "*SalvaCão — Ajuda*\n\n"
        "Posso ajudá-lo com:\n"
        "• Reportar um *cão perdido*\n"
        "• Reportar um *cão encontrado*\n"
        "• Adicionar um *avistamento* a um caso existente\n\n"
        "Comandos:\n"
        "/start — Começar\n"
        "/encontrado — O meu cão foi encontrado! 🎉\n"
        "/cancelar — Cancelar a conversa atual\n"
        "/ajuda — Esta mensagem\n\n"
        f"Website: {WEB_APP_URL}"
    )
    await _reply(update, help_text)


# ---------------------------------------------------------------------------
# Message handlers
# ---------------------------------------------------------------------------

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle plain text messages."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    text = update.message.text or ""  # type: ignore[union-attr]
    state = await _get_state(telegram_id)
    state.telegram_id = telegram_id
    await _run_brain(update, state, text)


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Transcribe voice note then run brain."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    voice = update.message.voice  # type: ignore[union-attr]
    if not voice:
        return

    if update.message:
        await update.message.chat.send_action(ChatAction.TYPING)

    # Download voice file
    tg_file = await context.bot.get_file(voice.file_id)
    buf = BytesIO()
    await tg_file.download_to_memory(buf)
    audio_bytes = buf.getvalue()

    # Transcribe
    try:
        transcribed = await transcribe_voice(audio_bytes, mime_type="audio/ogg")
    except Exception:
        logger.exception("Transcription failed for user %s", telegram_id)
        await _reply(update, "Não consegui ouvir bem o áudio 😔 Pode escrever em vez disso?")
        return

    if not transcribed:
        await _reply(update, "Não consegui transcrever o áudio. Pode escrever?")
        return

    # Confirm transcription to user
    if update.message:
        await update.message.reply_text(f"_(Ouvi: {transcribed})_", parse_mode=ParseMode.MARKDOWN)

    state = await _get_state(telegram_id)
    state.telegram_id = telegram_id
    await _run_brain(update, state, transcribed)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Upload photo to staging then run brain."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    photos = update.message.photo  # type: ignore[union-attr]
    if not photos:
        return

    if update.message:
        await update.message.chat.send_action(ChatAction.UPLOAD_PHOTO)

    asyncio.create_task(_warmup_ml())

    # Take highest resolution photo
    best_photo = max(photos, key=lambda p: p.file_size or 0)
    tg_file = await context.bot.get_file(best_photo.file_id)
    buf = BytesIO()
    await tg_file.download_to_memory(buf)
    image_bytes = buf.getvalue()

    # Upload to staging bucket
    try:
        staging_path = await upload_staging_photo(telegram_id, image_bytes, "image/jpeg")
    except Exception:
        logger.exception("Photo upload failed for user %s", telegram_id)
        await _reply(update, "Não consegui guardar a foto 😔 Pode tentar novamente?")
        return

    # Add to state
    state = await _get_state(telegram_id)
    state.telegram_id = telegram_id
    state.staged_photos.append(staging_path)

    # Get caption as text if provided, otherwise describe the upload
    caption = update.message.caption or ""
    user_text = caption if caption else "Enviei uma foto do cão."

    await _run_brain(update, state, user_text)


# ---------------------------------------------------------------------------
# /encontrado — owner self-service mark case as resolved
# ---------------------------------------------------------------------------

async def cmd_encontrado(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Owner marks their lost dog as found."""
    from storage import get_supabase
    telegram_id = update.effective_user.id  # type: ignore[union-attr]

    sb = get_supabase()
    result = sb.table("cases").select(
        "id, slug, dog_name, breed, last_seen_municipality"
    ).eq("reporter_telegram_id", str(telegram_id)).eq("status", "ativo").execute()

    cases = result.data or []

    if not cases:
        await _reply(update, "Não encontrei casos ativos associados a esta conta.")
        return

    if len(cases) == 1:
        c = cases[0]
        name = c.get("dog_name") or c.get("breed") or "cão"
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton(f"✅ Sim, o {name} foi encontrado!", callback_data=f"resolve:{c['slug']}"),
            InlineKeyboardButton("❌ Cancelar", callback_data="resolve:cancel"),
        ]])
        if update.message:
            await update.message.reply_text(
                f"Quer marcar o caso do *{name}* ({c['last_seen_municipality']}) como resolvido? 🎉",
                reply_markup=keyboard,
                parse_mode=ParseMode.MARKDOWN,
            )
    else:
        buttons = [[InlineKeyboardButton(
            f"{c.get('dog_name') or c.get('breed')} · {c['last_seen_municipality']}",
            callback_data=f"resolve:{c['slug']}",
        )] for c in cases]
        buttons.append([InlineKeyboardButton("❌ Cancelar", callback_data="resolve:cancel")])
        if update.message:
            await update.message.reply_text(
                "Qual dos casos quer marcar como resolvido?",
                reply_markup=InlineKeyboardMarkup(buttons),
            )


async def handle_resolve_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle inline button press for case resolution."""
    query = update.callback_query
    if not query:
        return
    await query.answer()

    if query.data == "resolve:cancel":
        await query.edit_message_text("Cancelado.")
        return

    slug = (query.data or "").split(":", 1)[1]
    telegram_id = update.effective_user.id  # type: ignore[union-attr]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{WEB_APP_URL}/api/bot/cases/{slug}/resolve",
                json={"telegram_id": str(telegram_id)},
                headers={"x-internal-token": INTERNAL_TOKEN},
            )

        if resp.status_code == 200:
            data = resp.json().get("data", {})
            name = data.get("dog_name") or "O cão"
            already = data.get("already", False)
            if already:
                await query.edit_message_text(f"O caso do {name} já estava marcado como resolvido. 🎉")
            else:
                await query.edit_message_text(
                    f"🎉 *{name} foi encontrado!*\n\nObrigado por usar o SalvaCão. "
                    f"Que alegria para toda a comunidade! 💙",
                    parse_mode=ParseMode.MARKDOWN,
                )
        elif resp.status_code == 403:
            await query.edit_message_text("Este caso não está associado à sua conta.")
        else:
            await query.edit_message_text("Erro ao marcar o caso. Tente novamente ou contacte a equipa.")
    except Exception:
        logger.exception("resolve callback failed for slug %s", slug)
        await query.edit_message_text("Erro de ligação. Tente novamente.")


# ---------------------------------------------------------------------------
# Application builder
# ---------------------------------------------------------------------------

async def _flush_notifications(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Job: flush pending PI agent owner messages via Telegram."""
    try:
        from storage import get_supabase
        db = get_supabase()
        pending = (
            db.table("case_notifications")
            .select("*")
            .is_("sent_at", "null")
            .eq("channel", "telegram")
            .limit(10)
            .execute()
        )
        for notif in (pending.data or []):
            tid = notif.get("telegram_id")
            if not tid:
                continue
            try:
                if SIM_MODE:
                    logger.info("[SIM] Telegram notify suppressed", notif_id=notif["id"], tid=tid, preview=notif["message"][:120])
                else:
                    await context.bot.send_message(chat_id=tid, text=notif["message"])
                db.table("case_notifications").update(
                    {"sent_at": "now()"}
                ).eq("id", notif["id"]).execute()
            except Exception as exc:
                logger.error("Telegram notify failed", notif_id=notif["id"], error=str(exc))
    except Exception as exc:
        logger.error("flush_notifications error", error=str(exc))


def build_application() -> Application:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("cancelar", cmd_cancelar))
    app.add_handler(CommandHandler("ajuda", cmd_ajuda))
    app.add_handler(CommandHandler("help", cmd_ajuda))

    app.add_handler(CommandHandler("encontrado", cmd_encontrado))
    app.add_handler(CallbackQueryHandler(handle_resolve_callback, pattern="^resolve:"))
    app.add_handler(CallbackQueryHandler(handle_step_callback, pattern="^step:"))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # Flush PI agent owner notifications every 60s
    if app.job_queue:
        app.job_queue.run_repeating(_flush_notifications, interval=60, first=15)

    return app
