"""
Telegram channel handler.

Converts Telegram updates into brain.run() calls and sends replies.
"""
from __future__ import annotations

import asyncio
import logging  # noqa: F401
import os
import pathlib
import structlog
from io import BytesIO

import httpx

from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup,
    KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove,
)
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

# structlog — _flush_notifications logs with kwargs (notif_id=, tid=, error=) which
# stdlib logging rejects with TypeError; structlog accepts them.
logger = structlog.get_logger(__name__)

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
    """Send a message, using Markdown if the text contains it.
    Uses effective_message so it works from both plain messages AND callback
    queries (button taps) — update.message is None on a CallbackQuery."""
    msg = update.effective_message
    if msg:
        await msg.reply_text(text, parse_mode=ParseMode.MARKDOWN)


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
        locale = updated_state.locale or "pt"
        # Owner's PRIVATE link: ?t=<owner_token> unlocks the OwnerPanel (triage,
        # resolve, PI assessment). Always include the locale prefix — the app routes
        # under /[locale]. Fall back to the public URL only if the token is missing.
        token = updated_state.created_case_owner_token
        case_url = (
            f"{WEB_APP_URL}/{locale}/caso/{slug}?t={token}"
            if token else f"{WEB_APP_URL}/{locale}/caso/{slug}"
        )
        poster_url = f"{WEB_APP_URL}/api/cases/{slug}/poster?locale={locale}"
        confirmation = (
            f"✅ *Caso criado com sucesso!*\n\n"
            f"🔗 [O teu caso (link privado)]({case_url})\n"
            f"📄 [Poster para imprimir]({poster_url})\n"
            f"📢 A publicar em grupos Facebook do Algarve...\n"
            f"🔍 A verificar coincidências na base de dados...\n\n"
            f"Envie-me mensagem quando tiver novidades. Não perca a esperança 💙"
        )
        await _reply(update, confirmation)

        # Bot-native lost-dog cases used to get a confirmation but never the guided
        # recovery protocol (only the web→telegram ?start= handoff started it). Start
        # it here so a dog reported directly in the bot gets the same step-by-step plan.
        if (updated_state.draft or {}).get("type") == "perdido":
            await _start_guided_flow(update, slug)


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
        [InlineKeyboardButton("❓ Como funciona / a ciência", callback_data="sobre:intro")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    welcome = (
        "Olá! Sou o assistente do *SalvaCão* 🐾\n\n"
        "Estou aqui para ajudar com cães perdidos e encontrados no Algarve.\n\n"
        "O que aconteceu?"
    )
    if update.message:
        await update.message.reply_text(welcome, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)


# Opening line per /start menu button — seeds the brain conversation so the inline
# buttons actually DO something (they were dead: emitted but no handler registered).
_FLOW_OPENERS = {
    "flow_perdido": "Perdi o meu cão.",
    "flow_encontrado": "Encontrei um cão na rua que parece perdido.",
    "flow_avistamento": "Vi um cão que acho que pode ser de um caso.",
}


async def handle_flow_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/start menu buttons (flow_perdido / flow_encontrado / flow_avistamento).
    Answers the tap, removes the menu so it can't be re-pressed, and kicks off the
    brain conversation with the matching opening line."""
    query = update.callback_query
    if not query:
        return
    await query.answer()
    try:
        await query.edit_message_reply_markup(reply_markup=None)
    except Exception:
        pass  # message too old / already edited — non-fatal
    opener = _FLOW_OPENERS.get(query.data or "")
    if not opener:
        return
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    state = await _get_state(telegram_id)
    state.telegram_id = telegram_id
    await _run_brain(update, state, opener)


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


async def _start_guided_flow(update: Update, slug: str) -> None:
    """Kick off the time-phased recovery protocol (step 0) for a case created
    DIRECTLY in the bot. Mirrors what _handle_handoff does for web-created cases:
    derive bucket + is_hard, build the sequence, pin it, and send the first step."""
    from datetime import datetime, timezone
    try:
        from storage import get_supabase
        from agent.pi_tools import build_step_sequence, bucket_from_hours
        db = get_supabase()
        res = (
            db.table("cases").select("id, last_seen_at, behavioral_profile")
            .eq("slug", slug).maybe_single().execute()
        )
        case = dict(res.data or {})
        if not case.get("id"):
            return
        hours = 0.0
        last_seen = case.get("last_seen_at")
        if last_seen:
            try:
                dt = datetime.fromisoformat(str(last_seen).replace("Z", "+00:00"))
                hours = max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0)
            except (ValueError, TypeError):
                hours = 0.0
        bp = case.get("behavioral_profile") or {}
        gate = bp.get("action_gate") or {}
        # is_hard mirrors sequence_for_case: passive profile / crowd-blocked.
        is_hard = (not gate.get("active_search_permitted", True)) or bool(gate.get("crowd_response_blocked"))
        bucket = bucket_from_hours(hours)
        steps = build_step_sequence(bucket, is_hard)
        _save_step_index(db, case["id"], bp, 0, bucket=bucket, is_hard=is_hard)
        chat = update.effective_chat
        if chat:
            await _send_step(update.get_bot(), chat.id, steps, 0)
    except Exception:
        logger.exception("failed to start guided flow for bot-native case %s", slug)


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
        "/sobre — O que é a Nona + a ciência 🔬\n"
        "/demo — Simulação: sinta como é ajudar a encontrar um cão 🎓\n"
        "/encontrado — O meu cão foi encontrado! 🎉\n"
        "/alertas — Receber alertas de cães perdidos perto de si 📍\n"
        "/alertas_parar — Deixar de receber alertas\n"
        "/chip — Veterinário: registar microchip de cão encontrado 🔬\n"
        "/cancelar — Cancelar a conversa atual\n"
        "/ajuda — Esta mensagem\n\n"
        f"Website: {WEB_APP_URL}"
    )
    await _reply(update, help_text)


# ---------------------------------------------------------------------------
# /alertas — community-observer opt-in: register as a geolocated volunteer so
# the PI agent can DM you "a X km de si" when a dog is lost near you.
# ---------------------------------------------------------------------------

_DEFAULT_ALERT_RADIUS_KM = 10.0


async def cmd_alertas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ask the user to share their location to subscribe to nearby lost-dog alerts.
    Optional radius arg: /alertas 5  (km, 1–50; default 10)."""
    radius = _DEFAULT_ALERT_RADIUS_KM
    if context.args:
        try:
            radius = max(1.0, min(50.0, float(str(context.args[0]).replace(",", "."))))
        except ValueError:
            pass
    if context.user_data is not None:
        context.user_data["alertas_radius"] = radius

    kb = ReplyKeyboardMarkup(
        [[KeyboardButton("📍 Partilhar a minha localização", request_location=True)]],
        resize_keyboard=True, one_time_keyboard=True,
    )
    if update.message:
        # Plain text (no Markdown): the command names contain underscores which
        # break Markdown entity parsing.
        await update.message.reply_text(
            "Quer ajudar a encontrar cães perdidos perto de si? 🐾\n\n"
            "A Nona não é um grupo de chat barulhento. Receberá mensagens privadas e "
            "apenas quando um cão se perder *mesmo* perto de si (geofencing).\n\n"
            f"Toque no botão para partilhar a sua localização. Avisamos quando "
            f"un cão se perder a menos de {radius:.0f} km de si — com instruções "
            "de segurança (observar, não perseguir).\n\n"
            "A sua localização é privada e apenas usada para calcular a distância. "
            "Pode sair quando quiser com /alertas_parar.",
            reply_markup=kb,
        )


async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """A shared location registers/updates the user as a real (non-simulated)
    volunteer in sim_volunteers, keyed by telegram_id."""
    if not update.message or not update.message.location:
        return
    loc = update.message.location
    tid = update.effective_user.id  # type: ignore[union-attr]
    radius = _DEFAULT_ALERT_RADIUS_KM
    if context.user_data and context.user_data.get("alertas_radius"):
        radius = float(context.user_data["alertas_radius"])
    name = (update.effective_user.first_name if update.effective_user else None) or "Voluntário"

    ok = _register_optin_volunteer(tid, loc.latitude, loc.longitude, name, radius)
    if not ok:
        await update.message.reply_text(
            "Algo correu mal ao registar. Tente novamente mais tarde.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    # Mid-demo location share: register silently and continue the demo with the
    # user's REAL zone, instead of the standalone /alertas confirmation.
    if context.user_data and context.user_data.pop("demo_await_location", False):
        await update.message.reply_text(
            "✅ Registado — e agora a usar a *sua* zona real.",
            reply_markup=ReplyKeyboardRemove(), parse_mode=ParseMode.MARKDOWN,
        )
        await _demo_send_zona(update.message.chat, (loc.latitude, loc.longitude), tid)
        return

    await update.message.reply_text(
        f"✅ Registado! Receberá alertas privados de cães perdidos a menos de "
        f"{radius:.0f} km daqui.\n\n"
        "Fique descansado: só o incomodamos se o cão estiver na sua vizinhança. "
        "Quando receber um alerta: observe à distância, NÃO persiga, e reporte "
        "foto + local. Para sair: /alertas_parar.\n\n"
        "Nunca recebeu um alerta? Faça /demo — uma simulação de 30s mostra-lhe "
        "exactamente como é.",
        reply_markup=ReplyKeyboardRemove(),
    )


async def cmd_alertas_parar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Opt out — deactivate the volunteer record (kept for re-activation)."""
    tid = update.effective_user.id  # type: ignore[union-attr]
    try:
        from storage import get_supabase
        get_supabase().table("sim_volunteers").update(
            {"active": False}
        ).eq("telegram_id", tid).execute()
    except Exception as exc:
        logger.error("alertas opt-out failed", tid=tid, error=str(exc))
    await _reply(update, "Deixou de receber alertas. Obrigado por ter ajudado 🐾 "
                         "Pode voltar quando quiser com /alertas.")


# ---------------------------------------------------------------------------
# /sobre — onboarding + the science. Since most of the experience now lives in
# Telegram, this explains what Nona is, why the method works (cited research),
# and what being a community observer means. Paginated via inline buttons.
# ---------------------------------------------------------------------------

_SOBRE_PAGES: dict[str, dict] = {
    "intro": {
        "text": (
            "🐾 *O que é a Nona*\n\n"
            "A Nona é uma ferramenta gratuita para cães perdidos e encontrados no Algarve. "
            "Não substitui os grupos de Facebook nem as associações — *multiplica* o que já fazem.\n\n"
            "Quando um cão se perde, a Nona age nos primeiros minutos: cria a página do caso, "
            "gera cartaz e QR, avisa canis e veterinários, e alerta observadores próximos — "
            "com o protocolo certo das primeiras horas, baseado em ciência.\n\n"
            "O dono não fica sozinho, e não fica sem saber o que fazer."
        ),
        "buttons": [("🔬 Porque funciona", "sobre:ciencia"), ("👀 Ser observador", "sobre:observador")],
    },
    "ciencia": {
        "text": (
            "🔬 *A ciência por trás*\n\n"
            "A maioria dos cães é encontrada nas primeiras 72h, muitas vezes perto de casa — "
            "*se* o dono fizer o correcto cedo. Os erros das primeiras horas custam vidas:\n\n"
            "• *Não perseguir.* Um cão assustado foge mais — um galgo já foi deslocado 11 km "
            "numa hora por um grupo bem-intencionado. Observar à distância > perseguir.\n"
            "• *Não chamar o nome* a um cão em pânico — condiciona-o a fugir, até do dono.\n"
            "• *Âncora de cheiro*: deixar uma peça do dono + comida no ponto exacto da fuga "
            "trá-lo de volta melhor que procurar.\n"
            "• *Ir ao canil em pessoa*, não telefonar — 2,1× mais recuperações (Lord 2007, JAVMA).\n"
            "• Em pânico, o cérebro humano não processa listas longas (Arnsten 2009) — por isso "
            "a Nona dá *uma acção de cada vez*.\n\n"
            "A Nona aplica isto automaticamente, ajustado à raça, fase e terreno."
        ),
        "buttons": [("👀 Ser observador", "sobre:observador"), ("⬅️ Início", "sobre:intro")],
    },
    "observador": {
        "text": (
            "👀 *Ser observador da comunidade*\n\n"
            "Com /alertas, recebe um aviso privado quando um cão se perde perto de si — "
            "com a distância exacta ao local e instruções de segurança.\n\n"
            "Não é um grupo de chat: só recebe alertas *hyper-locais* (geofencing) "
            "relevantes para onde vive ou está.\n\n"
            "O seu papel é simples e poderoso:\n"
            "• *Olhar bem* na sua zona — quintais, valas, zonas de sombra.\n"
            "• Se vir o cão: *não persiga, não chame* — observe à distância.\n"
            "• Reporte *foto + local + hora*. Isso chega.\n\n"
            "Não precisa de capturar nada. Os olhos certos no sítio certo, na primeira hora, "
            "são o que traz cães de volta.\n\n"
            "Experimente primeiro — faça a simulação de 30s e veja como é."
        ),
        "buttons": [
            ("▶️ Experimentar (simulação 30s)", "demo:alert"),
            ("🔬 Porque funciona", "sobre:ciencia"),
        ],
    },
}


def _sobre_markup(page: str) -> InlineKeyboardMarkup:
    # Fall back to "intro" for an unknown page key so a stale/malformed callback can
    # never raise KeyError and silently drop the tap.
    spec = _SOBRE_PAGES.get(page) or _SOBRE_PAGES["intro"]
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton(label, callback_data=cb)]
         for label, cb in spec["buttons"]]
    )


async def cmd_sobre(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    page = _SOBRE_PAGES["intro"]
    if update.message:
        await update.message.reply_text(
            page["text"], reply_markup=_sobre_markup("intro"), parse_mode=ParseMode.MARKDOWN,
        )


async def handle_sobre_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query:
        return
    await query.answer()
    page_key = (query.data or "sobre:intro").split(":", 1)[1]
    page = _SOBRE_PAGES.get(page_key, _SOBRE_PAGES["intro"])
    try:
        await query.edit_message_text(
            page["text"], reply_markup=_sobre_markup(page_key), parse_mode=ParseMode.MARKDOWN,
        )
    except Exception:
        # edit can fail if content is identical; ignore
        pass


# ---------------------------------------------------------------------------
# /demo — the observer "aha moment": a 30-second scripted practice case. The new
# observer receives a (clearly-marked) training alert, makes the one safety-critical
# choice (observe vs chase), and feels the dog found because of them. Pure message
# choreography — NO DB writes, NO real alert, NO case. Every message is marked as a
# drill so it can never be confused with a real alert (anti cried-wolf).
# ---------------------------------------------------------------------------

_DEMO_TAG = "🎓 *SIMULAÇÃO — TREINO*"
_DEMO_ASSETS = pathlib.Path(__file__).parent.parent / "assets" / "demo"
# Demo is set at a REAL Algarve location (Loulé) so the same renderer that draws
# this map drives real alerts too — the demo is a literal preview of the product.
_DEMO_CENTER = (37.1377, -8.0226)   # last-seen point (lat, lng)
_DEMO_RADIUS_KM = 3.0
_DEMO_SIGHTING = (37.1505, -8.0150)  # "another observer" sighting, ~2km NE, near a road


def _demo_kb(buttons: list[tuple[str, str]]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton(l, callback_data=c)] for l, c in buttons])


def _demo_user_center(tid: int) -> tuple[float, float]:
    """The demo is anchored on the user's own registered location (if they opted in
    via /alertas) so the search zone is literally around them. Falls back to Loulé."""
    try:
        from storage import get_supabase
        from agent.pi_tools import _parse_point
        row = (get_supabase().table("sim_volunteers")
               .select("home_coords").eq("telegram_id", tid).limit(1).execute().data)
        if row:
            c = _parse_point(row[0].get("home_coords"))
            if c:
                return (c[0], c[1])
    except Exception:
        pass
    return _DEMO_CENTER


def _ensure_demo_luna_case(tid: int, center: tuple[float, float]) -> str | None:
    """Create/refresh a real (demo-tagged) Luna case near the user so the demo can
    link to a live case page. agent_state='active' keeps it out of the new-case sweep;
    source='demo' makes it purgeable. Returns the slug, or None on failure."""
    import datetime
    slug = f"demo-luna-{tid}"
    row = {
        "slug": slug, "type": "perdido", "status": "ativo", "sensitivity": "publico",
        "dog_name": "Luna", "breed": "Galgo", "sex": "femea", "size": "medio",
        "primary_color": "castanho claro",
        "last_seen_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "last_seen_municipality": "Loulé", "last_seen_zone_approx": "junto ao parque",
        "last_seen_coords_approx": f"({center[1]},{center[0]})",
        "description": "Caso de demonstração da Nona (cão fictício, para treino de observadores).",
        "reporter_name": "Demo", "reporter_email": "demo@salvacao.local",
        "agent_state": "active", "source": "demo",
    }
    try:
        from storage import get_supabase
        db = get_supabase()
        res = db.table("cases").upsert(row, on_conflict="slug").execute()
        case_id = (res.data[0]["id"] if res.data else
                   db.table("cases").select("id").eq("slug", slug).single().execute().data["id"])
        _ensure_demo_luna_image(db, case_id, slug)
        return slug
    except Exception as exc:
        logger.error("demo luna case upsert failed", error=str(exc))
        return None


def _ensure_demo_luna_image(db, case_id: str, slug: str) -> None:
    """Attach Luna's photo to the demo case (once) so the case page shows her."""
    try:
        existing = db.table("case_images").select("id").eq("case_id", case_id).limit(1).execute().data
        if existing:
            return
        path = f"demo/{slug}.jpg"
        with open(_DEMO_ASSETS / "luna_lost.jpg", "rb") as f:
            data = f.read()
        try:
            db.storage.from_("case-images-public").upload(
                path, data, {"content-type": "image/jpeg", "upsert": "true"},
            )
        except Exception:
            pass  # already uploaded / race — getPublicUrl still works
        public_url = db.storage.from_("case-images-public").get_public_url(path)
        db.table("case_images").insert({
            "case_id": case_id, "storage_path_public": path, "public_url": public_url,
            "is_primary": True, "image_type": "referencia",
        }).execute()
    except Exception as exc:
        logger.error("demo luna image attach failed", error=str(exc))


def _register_optin_volunteer(tid: int, lat: float, lng: float, name: str, radius: float) -> bool:
    """Upsert a real (non-simulated) observer keyed by telegram_id. Returns ok."""
    try:
        from storage import get_supabase
        get_supabase().table("sim_volunteers").upsert({
            "telegram_id": tid, "display_name": name or "Voluntário",
            "home_coords": f"({lng},{lat})", "municipality": "",
            "radius_km": radius, "active": True, "is_simulated": False,
            "consent_at": "now()", "source": "optin",
        }, on_conflict="telegram_id").execute()
        return True
    except Exception as exc:
        logger.error("optin volunteer upsert failed", tid=tid, error=str(exc))
        return False


def _demo_has_location(tid: int) -> bool:
    """True if this user already shared a location (registered observer)."""
    try:
        from storage import get_supabase
        return bool(get_supabase().table("sim_volunteers")
                    .select("telegram_id").eq("telegram_id", tid).limit(1).execute().data)
    except Exception:
        return False


async def _demo_send_zona(chat, center: tuple[float, float], tid: int) -> None:
    """The map+reasoning beat — reusable so it can run after a mid-demo location share."""
    from agent.maps import fetch_search_map_png
    live = f"https://www.google.com/maps/search/?api=1&query={center[0]:.5f},{center[1]:.5f}"
    cap = (
        f"{_DEMO_TAG}\n\n"
        "🧭 *Zona de busca calculada pela Nona*\n"
        "📍 Ponto de fuga · raio ~3 km · *fase aguda* (primeiras horas)\n\n"
        "*Porquê esta zona — e não a vila toda:*\n"
        "• Uma galga assustada entra em modo sobrevivência logo ao minuto 0: não "
        "procura pessoas — esconde-se e desloca-se por vales, linhas de água e "
        "bermas com mato, evitando ruas abertas e barulho.\n"
        "• Nas primeiras horas raramente se afasta muito do ponto de fuga — por isso "
        "o raio começa apertado e só alarga se houver um avistamento confirmado.\n"
        "• Persegui-la ou chamá-la empurra-a para *mais* longe (e para a estrada). "
        "O protocolo é observar, nunca convergir.\n\n"
        f"🔗 [Abrir esta zona no mapa]({live})\n\n"
        "Só os observadores *dentro da zona* — como você — são avisados. "
        "Não tem de a encontrar. Basta estar atento."
    )
    kb = _demo_kb([("👀 Fico atento", "demo:network")])
    png = fetch_search_map_png(center, _DEMO_RADIUS_KM, [(center[0], center[1], "L", "red")])
    if png:
        await chat.send_photo(photo=png, caption=cap, parse_mode=ParseMode.MARKDOWN, reply_markup=kb)
    else:
        await chat.send_message(cap, parse_mode=ParseMode.MARKDOWN, reply_markup=kb)


async def cmd_demo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        f"{_DEMO_TAG}\n\n"
        "Quer *sentir* como é ajudar a encontrar um cão? 🐾\n\n"
        "30 segundos, um caso real recriado — nenhum cão verdadeiro envolvido. "
        "Vai viver o que acontece quando se torna um observador.",
        reply_markup=_demo_kb([("▶️ Começar", "demo:alert")]),
        parse_mode=ParseMode.MARKDOWN,
    )


async def handle_demo_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query:
        return
    await query.answer()
    step = (query.data or "demo:alert").split(":", 1)[1]

    # Disable the buttons on the message that was just tapped, so old steps can't be
    # re-tapped (prevents the flow branching/duplicating or feeling "stuck").
    try:
        await query.edit_message_reply_markup(reply_markup=None)
    except Exception:
        pass

    chat = query.message.chat  # type: ignore[union-attr]

    async def say(text: str, buttons: list[tuple[str, str]] | None = None):
        await chat.send_message(
            text, parse_mode=ParseMode.MARKDOWN,
            reply_markup=_demo_kb(buttons) if buttons else None,
        )

    async def photo(fname: str, caption: str, buttons: list[tuple[str, str]] | None = None):
        path = _DEMO_ASSETS / fname
        try:
            with open(path, "rb") as f:
                await chat.send_photo(
                    photo=f, caption=caption, parse_mode=ParseMode.MARKDOWN,
                    reply_markup=_demo_kb(buttons) if buttons else None,
                )
        except Exception:
            # If the asset is missing, fall back to text so the flow never breaks.
            await say(caption, buttons)

    tid = update.effective_user.id  # type: ignore[union-attr]
    center = _demo_user_center(tid)

    if step == "alert":
        slug = _ensure_demo_luna_case(tid, center)
        if context.user_data is not None:
            context.user_data["demo_slug"] = slug
        case_link = f"{WEB_APP_URL}/pt/caso/{slug}" if slug else WEB_APP_URL
        await photo(
            "luna_lost.jpg",
            f"{_DEMO_TAG}\n\n"
            "🚨 *CÃO PERDIDO — perto de si*\n\n"
            "*Luna* · galga · castanha clara\n"
            "Perdida há 40 min. É medrosa — foge de estranhos.\n\n"
            "👉 *Não a persiga. Não a chame.* Se a vir, só observe de longe e diga onde.\n\n"
            f"🔗 [Abrir o caso da Luna]({case_link}) — é assim que vê qualquer caso real.\n\n"
            "Este alerta acabou de chegar ao seu telemóvel — porque está dentro da zona.",
            [("🧭 Ver a minha zona", "demo:zona")],
        )
    elif step == "zona":
        # Use the user's REAL location from here on. If they haven't shared it, ask
        # now ("ver a SUA zona") — a motivated opt-in that also enrols them.
        if _demo_has_location(tid):
            await _demo_send_zona(chat, center, tid)
        else:
            if context.user_data is not None:
                context.user_data["demo_await_location"] = True
                context.user_data["alertas_radius"] = _DEFAULT_ALERT_RADIUS_KM
            kb = ReplyKeyboardMarkup(
                [[KeyboardButton("📍 Partilhar a minha localização", request_location=True)]],
                resize_keyboard=True, one_time_keyboard=True,
            )
            await chat.send_message(
                f"{_DEMO_TAG}\n\n"
                "Para lhe mostrar a *sua* zona real — e o que receberia num caso a sério — "
                "partilhe a localização 👇\n\n"
                "Serve só para calcular a distância aos casos.",
                reply_markup=kb, parse_mode=ParseMode.MARKDOWN,
            )
    elif step == "network":
        # The net, not the lone hero: ANOTHER observer ~400m away spots her.
        # Reuse the case created in step 1 (don't re-create). One map only: the
        # interactive native location pin (no redundant Maps text link).
        slat = center[0] + 0.0040   # ~440m north
        slng = center[1] + 0.0015
        slug = (context.user_data or {}).get("demo_slug")
        case_link = f"{WEB_APP_URL}/pt/caso/{slug}" if slug else WEB_APP_URL
        await photo(
            "luna_sighting.jpg",
            f"{_DEMO_TAG}\n\n"
            "📣 *Marco — observador a ~400 m de si* — acabou de ver a Luna e enviou isto:\n\n"
            "Ela vai em direcção à estrada. O caso já tem foto, local exacto e a sua atenção.\n\n"
            f"🔗 [Ver o caso da Luna]({case_link})",
            [("➡️ E depois?", "demo:win")],
        )
        # One map: the interactive native location pin (tappable, opens maps).
        try:
            await chat.send_location(latitude=slat, longitude=slng)
        except Exception:
            pass
    elif step == "win":
        await say(
            f"{_DEMO_TAG}\n\n"
            "O dono recebe a foto e o local exacto. Estava perto — chega devagar, "
            "sem correr, e a Luna reconhece-o antes da passadeira.\n\n"
            "🐾 *Está em casa.*\n\n"
            "Ninguém a perseguiu nem a apanhou. Foram vários olhos atentos — o seu incluído — "
            "que a mantiveram debaixo de olho até o dono chegar. É só isto que pedimos.",
            [("✅ Terminar", "demo:cta")],
        )
    elif step == "cta":
        # If they shared location at step 2, they're already enrolled — confirm it.
        # Otherwise offer the opt-in now.
        if _demo_has_location(tid):
            await say(
                "Isto foi um treino — o próximo alerta será sobre um cão verdadeiro perto de si. 🐾\n\n"
                "*Já está activo.* Vai receber alertas só quando um cão se perder na sua zona. "
                "Quando vir um, é só tirar foto e enviar.\n\n"
                "Para sair quando quiser: /alertas\\_parar.",
            )
        else:
            kb = ReplyKeyboardMarkup(
                [[KeyboardButton("📍 Partilhar a minha localização", request_location=True)]],
                resize_keyboard=True, one_time_keyboard=True,
            )
            if context.user_data is not None:
                context.user_data["alertas_radius"] = _DEFAULT_ALERT_RADIUS_KM
            await chat.send_message(
                "Isto foi um treino — o próximo alerta será sobre um cão verdadeiro perto de si. 🐾\n\n"
                "Para se tornar observador, partilhe a localização (só serve para calcular "
                "a distância aos casos). Avisamos só quando for preciso.",
                reply_markup=kb,
            )


# ---------------------------------------------------------------------------
# Message handlers
# ---------------------------------------------------------------------------

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle plain text messages. Delegates to chip flow if active."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    text = update.message.text or ""  # type: ignore[union-attr]
    state = await _get_state(telegram_id)
    state.telegram_id = telegram_id
    
    # Delegate to chip flow if draft exists
    if state.draft and state.draft.get("chip_number"):
        await handle_chip_text(update, context)
        return
    
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
    
    # Delegate to chip flow if draft exists
    if state.draft and state.draft.get("chip_number"):
        # Voice not supported in chip flow yet — treat as text input
        await handle_chip_text(update, context)
        return
    
    await _run_brain(update, state, transcribed)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Upload photo to staging then run brain. Delegates to chip flow if active."""
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

    # Delegate to chip flow if draft exists
    if state.draft and state.draft.get("chip_number"):
        await handle_chip_photo(update, context)
        return

    # Get caption as text if provided, otherwise describe the upload
    caption = update.message.caption or ""
    user_text = caption if caption else "Enviei uma foto do cão."

    await _run_brain(update, state, user_text)


# ---------------------------------------------------------------------------
# /chip — veterinarian chip scan submission (WS-G-Vet Phase 3)
# ---------------------------------------------------------------------------

async def cmd_chip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Vet submits a chip scan directly via Telegram bot.
    
    Flow:
    1. Vet sends: /chip 900123456789013
    2. Bot checks if sender is a registered clinic vet (clinic_partners.contact_telegram_id)
    3. If yes → asks for: photo (optional), municipality, zone, notes
    4. Submits to /api/clinic/intake
    """
    from storage import get_supabase
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    
    sb = get_supabase()
    
    # Check if this user is a registered clinic vet
    clinic = (
        sb.table("clinic_partners")
        .select("id, name, municipality, intake_slug, panel_token, is_approved")
        .eq("contact_telegram_id", str(telegram_id))
        .eq("is_approved", True)
        .maybe_single()
        .execute()
    )
    
    if not clinic.data:
        await _reply(
            update,
            "🔬 Este comando é apenas para veterinários registados na Nona.\n\n"
            "Se é veterinário e quer aderir, peça ao administrador para o registar "
            "em `/admin/clinicas`. Depois partilhe o seu ID de Telegram.\n\n"
            "O seu ID: `" + str(telegram_id) + "`",
        )
        return
    
    clinic_data = clinic.data
    
    # Parse arguments
    args = context.args or []
    if not args:
        await _reply(
            update,
            "🔬 *Registar microchip*\n\n"
            "Envie o número do chip assim:\n"
            "`/chip 900123456789013`\n\n"
            "Opcional: pode enviar uma foto do cão depois.",
        )
        return
    
    chip_number = str(args[0]).strip()
    
    # Validate chip number (basic: 15 digits)
    if not chip_number.isdigit() or len(chip_number) not in (15, 10, 9, 8):
        await _reply(
            update,
            "⚠️ Número de chip inválido. Deve ter 15 dígitos (padrão ISO).\n\n"
            "Exemplo: `/chip 900123456789013`",
        )
        return
    
    # Store chip in conversation state for multi-step flow
    state = await _get_state(telegram_id)
    state.telegram_id = telegram_id
    state.draft = {
        "type": "encontrado",
        "clinic_id": clinic_data["id"],
        "intake_slug": clinic_data["intake_slug"],
        "panel_token": clinic_data["panel_token"],
        "chip_number": chip_number,
        "municipality": clinic_data.get("municipality") or "",
    }
    await _save_state(telegram_id, state)
    
    # If clinic has a municipality, pre-fill it
    prefilled_muni = clinic_data.get("municipality") or ""
    
    keyboard = [
        [InlineKeyboardButton("📸 Enviar foto", callback_data="chip:photo")],
        [InlineKeyboardButton("📍 Confirmar localização", callback_data="chip:location")],
        [InlineKeyboardButton("➡️ Submeter sem foto", callback_data="chip:submit")],
        [InlineKeyboardButton("❌ Cancelar", callback_data="chip:cancel")],
    ]
    
    msg = (
        f"🔬 *Chip registado:* `{chip_number}`\n\n"
        f"Clínica: *{clinic_data['name']}*\n"
    )
    if prefilled_muni:
        msg += f"Concelho: *{prefilled_muni}*\n\n"
    else:
        msg += "\nPreciso de saber onde foi encontrado.\n"
    
    msg += (
        "O que quer fazer?\n\n"
        "• Enviar foto → cruza com cães perdidos automaticamente\n"
        "• Submeter sem foto → regista o chip na base de dados"
    )
    
    if update.message:
        await update.message.reply_text(
            msg,
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode=ParseMode.MARKDOWN,
        )


async def handle_chip_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /chip inline button taps (photo, location, submit, cancel)."""
    query = update.callback_query
    if not query:
        return
    await query.answer()
    
    telegram_id: int = update.effective_user.id  # type: ignore[union-attr]
    state = await _get_state(telegram_id)
    draft = state.draft or {}
    
    action = (query.data or "").split(":", 1)[1] if ":" in (query.data or "") else ""
    
    if action == "cancel":
        state.draft = {}
        await _save_state(telegram_id, state)
        await query.edit_message_text("❌ Cancelado.")
        return
    
    if action == "photo":
        await query.edit_message_text(
            "📸 Envie uma foto do cão agora. Vou cruzar com os cães perdidos automaticamente.",
        )
        return
    
    if action == "location":
        await query.edit_message_text(
            "📍 Em que concelho e zona foi encontrado?\n\n"
            "Exemplo: *Faro, junto ao Lidl*",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    
    if action == "submit":
        await _submit_chip(update, state)
        return


async def handle_chip_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle text messages during the /chip multi-step flow.
    
    Expected inputs:
    - After 'chip:location': "Faro, junto ao Lidl"
    - After 'chip:photo' (photo already sent): notes
    """
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    state = await _get_state(telegram_id)
    draft = state.draft or {}
    
    # Only process if we're in a chip flow
    if not draft.get("chip_number"):
        return  # not in chip flow, ignore (will be handled by normal handle_text)
    
    text = update.message.text or "" if update.message else ""
    
    # Check if municipality is set
    if not draft.get("municipality"):
        # This text is the location
        parts = text.split(",", 1)
        draft["municipality"] = parts[0].strip()
        draft["zone"] = parts[1].strip() if len(parts) > 1 else ""
        state.draft = draft
        await _save_state(telegram_id, state)
        
        keyboard = [
            [InlineKeyboardButton("➡️ Submeter", callback_data="chip:submit")],
            [InlineKeyboardButton("❌ Cancelar", callback_data="chip:cancel")],
        ]
        if update.message:
            await update.message.reply_text(
                f"📍 *{draft['municipality']}* · {draft['zone']}\n\n"
                f"Chip: `{draft['chip_number']}`\n\n"
                f"Pronto para submeter?",
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode=ParseMode.MARKDOWN,
            )
        return
    
    # Municipality already set → this is notes
    draft["note"] = text
    state.draft = draft
    await _save_state(telegram_id, state)
    
    keyboard = [
        [InlineKeyboardButton("➡️ Submeter", callback_data="chip:submit")],
        [InlineKeyboardButton("❌ Cancelar", callback_data="chip:cancel")],
    ]
    if update.message:
        await update.message.reply_text(
            f"📝 Notas: {text}\n\n"
            f"Chip: `{draft['chip_number']}`\n"
            f"Local: *{draft['municipality']}* · {draft.get('zone', '')}\n\n"
            f"Pronto para submeter?",
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode=ParseMode.MARKDOWN,
        )


async def handle_chip_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle photo upload during the /chip multi-step flow."""
    telegram_id = update.effective_user.id  # type: ignore[union-attr]
    state = await _get_state(telegram_id)
    draft = state.draft or {}
    
    # Only process if we're in a chip flow
    if not draft.get("chip_number"):
        return  # not in chip flow, let normal handle_photo take over
    
    photos = update.message.photo if update.message else None  # type: ignore[union-attr]
    if not photos:
        return
    
    if update.message:
        await update.message.chat.send_action(ChatAction.UPLOAD_PHOTO)
    
    # Download and upload to staging
    best_photo = max(photos, key=lambda p: p.file_size or 0)
    tg_file = await context.bot.get_file(best_photo.file_id)
    buf = BytesIO()
    await tg_file.download_to_memory(buf)
    image_bytes = buf.getvalue()
    
    try:
        staging_path = await upload_staging_photo(telegram_id, image_bytes, "image/jpeg")
        draft["staged_photo_path"] = staging_path
        state.draft = draft
        await _save_state(telegram_id, state)
    except Exception:
        logger.exception("Photo upload failed in /chip flow")
        await _reply(update, "❌ Não consegui guardar a foto. Tente novamente.")
        return
    
    keyboard = [
        [InlineKeyboardButton("📍 Adicionar localização", callback_data="chip:location")],
        [InlineKeyboardButton("➡️ Submeter", callback_data="chip:submit")],
    ]
    if update.message:
        await update.message.reply_text(
            "✅ Foto recebida. Vou cruzar com os cães perdidos.\n\n"
            "Quer adicionar a localização antes de submeter?",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )


async def _submit_chip(update: Update, state: ConvState) -> None:
    """Submit the chip scan to /api/clinic/intake."""
    draft = state.draft or {}
    intake_slug = draft.get("intake_slug")
    chip_number = draft.get("chip_number")
    municipality = draft.get("municipality")
    
    if not intake_slug or not chip_number or not municipality:
        await _reply(update, "❌ Faltam dados. Comece de novo com `/chip`.")
        return
    
    payload = {
        "intakeSlug": intake_slug,
        "stagedPhotoPath": draft.get("staged_photo_path"),
        "chipNumber": chip_number,
        "municipality": municipality,
        "zone": draft.get("zone", ""),
        "note": draft.get("note", ""),
        "vetName": update.effective_user.first_name if update.effective_user else "Veterinário",
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{WEB_APP_URL}/api/clinic/intake",
                json=payload,
                headers={"x-internal-token": INTERNAL_TOKEN},
            )
        
        data = resp.json()
        
        if resp.status_code == 200:
            result = data.get("result", "created")
            case_slug = data.get("caseSlug", "")
            panel_url = data.get("panelUrl", "")
            
            if result == "matched":
                dog_name = data.get("dogName", "Cão")
                score = data.get("score", 0)
                await _reply(
                    update,
                    f"🎯 *Cruzamento encontrado!*\n\n"
                    f"*{dog_name}* — semelhança {score}%\n"
                    f"🔗 Caso: {WEB_APP_URL}/caso/{case_slug}\n\n"
                    f"O dono vai confirmar se é o cão dele.",
                )
            elif result == "chip_known":
                status = data.get("status", "ativo")
                await _reply(
                    update,
                    f"ℹ️ *Chip já registado*\n\n"
                    f"Este chip já está na base de dados.\n"
                    f"🔗 Caso: {WEB_APP_URL}/caso/{case_slug}\n"
                    f"Estado: {status}",
                )
            else:
                await _reply(
                    update,
                    f"✅ *Caso criado*\n\n"
                    f"Chip `{chip_number}` registado.\n"
                    f"🔗 Caso: {WEB_APP_URL}/caso/{case_slug}\n"
                    f"🩺 Painel: {WEB_APP_URL}{panel_url}",
                )
        else:
            error = data.get("error", "Erro desconhecido")
            await _reply(update, f"❌ Erro ao submeter: {error}")
    except Exception:
        logger.exception("Chip submission failed")
        await _reply(update, "❌ Erro de ligação. Tente novamente.")
    finally:
        # Clear draft
        state.draft = {}
        await _save_state(telegram_id_from_state(state), state)


def telegram_id_from_state(state: ConvState) -> int:
    """Extract telegram_id from ConvState safely."""
    return getattr(state, "telegram_id", 0) or 0


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

    parts = (query.data or "").split(":")
    slug = parts[1]
    method = parts[2] if len(parts) > 2 else None

    if not method:
        # Ask for recovery method
        buttons = [
            [InlineKeyboardButton("🏠 Voltou sozinho", callback_data=f"resolve:{slug}:returned_home")],
            [InlineKeyboardButton("👀 Avistamento Nona", callback_data=f"resolve:{slug}:nona_sighting")],
            [InlineKeyboardButton("📱 Redes Sociais", callback_data=f"resolve:{slug}:social_media")],
            [InlineKeyboardButton("👤 Encontrado por mim", callback_data=f"resolve:{slug}:found_by_owner")],
            [InlineKeyboardButton("🏥 Canil/Vet", callback_data=f"resolve:{slug}:shelter_vet")],
            [InlineKeyboardButton("🪤 Armadilha/Comida", callback_data=f"resolve:{slug}:trap_feeding")],
            [InlineKeyboardButton("❓ Outro", callback_data=f"resolve:{slug}:other")],
        ]
        await query.edit_message_text(
            "Como foi o cão encontrado? Esta informação ajuda a Nona a aprender.",
            reply_markup=InlineKeyboardMarkup(buttons)
        )
        return

    telegram_id = update.effective_user.id  # type: ignore[union-attr]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{WEB_APP_URL}/api/bot/cases/{slug}/resolve",
                json={"telegram_id": str(telegram_id), "method": method},
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

_MAX_REAL_PER_FLUSH = 20  # throttle real sends to stay under Telegram rate limits


async def _flush_notifications(context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Flush pending PI agent notifications via Telegram, with per-recipient routing.

    REAL delivery only for ids in SIM_REAL_DELIVERY_ALLOWLIST (and not flagged
    is_simulated); everyone else is recorded as sent WITHOUT a Telegram API call.
    SIMULATION_MODE=true forces everything virtual.
    """
    from agent import sim_config

    try:
        from storage import get_supabase
        db = get_supabase()
        pending = (
            db.table("case_notifications")
            .select("*")
            .is_("sent_at", "null")
            .eq("channel", "telegram")
            .limit(200)
            .execute()
        )

        sim_ids: list = []   # virtual recipients — bulk-marked sent, no API call
        real_sent = 0

        for notif in (pending.data or []):
            tid = notif.get("telegram_id")
            if not tid:
                continue

            real = sim_config.is_real_recipient(tid) and not notif.get("is_simulated")

            if not real:
                logger.info(
                    "[SIM] Telegram notify recorded",
                    notif_id=notif["id"], tid=tid,
                    is_simulated=notif.get("is_simulated"),
                    distance_km=notif.get("distance_km"),
                    preview=str(notif.get("message", ""))[:80],
                )
                sim_ids.append(notif["id"])
                continue

            # Real delivery — throttled.
            if real_sent >= _MAX_REAL_PER_FLUSH:
                db.table("case_notifications").update(
                    {"rate_limit_flag": True}
                ).eq("id", notif["id"]).execute()  # leave pending for next flush
                continue

            metadata = notif.get("metadata") or {}
            reply_markup = None
            if metadata.get("inline_buttons"):
                buttons = []
                for row in metadata["inline_buttons"]:
                    buttons.append([InlineKeyboardButton(b["text"], callback_data=b["callback_data"]) for b in row])
                reply_markup = InlineKeyboardMarkup(buttons)

            try:
                await context.bot.send_message(
                    chat_id=tid,
                    text=notif["message"],
                    reply_markup=reply_markup,
                    parse_mode=ParseMode.MARKDOWN if "*" in notif["message"] else None
                )
                real_sent += 1
                await asyncio.sleep(0.05)
                db.table("case_notifications").update(
                    {"sent_at": "now()"}
                ).eq("id", notif["id"]).execute()
            except Exception as exc:
                logger.error("Telegram notify failed", notif_id=notif["id"], error=str(exc))

        if sim_ids:
            db.table("case_notifications").update(
                {"sent_at": "now()"}
            ).in_("id", sim_ids).execute()
    except Exception as exc:
        logger.error("flush_notifications error", error=str(exc))


async def handle_ack_alert_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle volunteer acknowledgement of an alert."""
    query = update.callback_query
    if not query or not query.message:
        return
    await query.answer()

    parts = (query.data or "").split(":")
    # status: watching | busy
    status = parts[2]

    if status == "watching":
        await query.edit_message_text(
            rf"{query.message.text_markdown_v2}\n\n👀 *Registado: Está atento\! Obrigado\.*",
            parse_mode=ParseMode.MARKDOWN_V2
        )
    elif status == "busy":
        await query.edit_message_text(
            rf"{query.message.text_markdown_v2}\n\n❌ *Registado: Agora não pode\.*",
            parse_mode=ParseMode.MARKDOWN_V2
        )


def build_application() -> Application:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("cancelar", cmd_cancelar))
    app.add_handler(CommandHandler("ajuda", cmd_ajuda))
    app.add_handler(CommandHandler("help", cmd_ajuda))

    app.add_handler(CommandHandler("encontrado", cmd_encontrado))
    app.add_handler(CommandHandler("alertas", cmd_alertas))
    app.add_handler(CommandHandler("alertas_parar", cmd_alertas_parar))
    app.add_handler(CommandHandler("sobre", cmd_sobre))
    app.add_handler(CommandHandler("demo", cmd_demo))
    app.add_handler(CommandHandler("chip", cmd_chip))
    app.add_handler(CallbackQueryHandler(handle_flow_callback, pattern="^flow_"))
    app.add_handler(CallbackQueryHandler(handle_resolve_callback, pattern="^resolve:"))
    app.add_handler(CallbackQueryHandler(handle_ack_alert_callback, pattern="^ack_alert:"))
    app.add_handler(CallbackQueryHandler(handle_step_callback, pattern="^step:"))
    app.add_handler(CallbackQueryHandler(handle_sobre_callback, pattern="^sobre:"))
    app.add_handler(CallbackQueryHandler(handle_demo_callback, pattern="^demo:"))
    app.add_handler(CallbackQueryHandler(handle_chip_callback, pattern="^chip:"))

    app.add_handler(MessageHandler(filters.LOCATION, handle_location))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # Flush PI agent owner notifications every 60s
    if app.job_queue:
        app.job_queue.run_repeating(_flush_notifications, interval=60, first=15)

    return app
