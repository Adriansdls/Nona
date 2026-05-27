"""
Email notifications from the PI agent.

Uses Resend Python SDK — same RESEND_API_KEY as the Next.js app.
Separate from the Next.js email module (bot is a standalone Python process).
"""
from __future__ import annotations

import logging
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

import resend as _resend

log = logging.getLogger(__name__)

_FROM = os.environ.get("EMAIL_FROM", "nona@salvacao.pt")
_APP_URL = os.environ.get("WEB_APP_URL", "https://salvacao.pt")


def _init() -> bool:
    key = os.environ.get("RESEND_API_KEY", "")
    if not key:
        log.warning("RESEND_API_KEY not set — email notifications disabled")
        return False
    _resend.api_key = key
    return True


def send_canil_notification(canil_email: str, canil_name: str, case: dict) -> bool:
    """Email a canil about a lost dog case. Returns True if sent."""
    if not _init():
        return False

    slug = case.get("slug", "")
    dog_name = case.get("dog_name") or "Sem nome"
    breed = case.get("breed", "indefinido")
    color = case.get("primary_color", "")
    municipality = case.get("last_seen_municipality", "")
    zone = case.get("last_seen_zone_approx", "")
    description = case.get("description", "")
    case_url = f"{_APP_URL}/pt/caso/{slug}"

    try:
        _resend.Emails.send({
            "from": _FROM,
            "to": canil_email,
            "subject": f"[SalvaCão] Cão perdido em {municipality} — por favor consulte animais recebidos",
            "html": f"""
<p>Olá equipa do <strong>{canil_name}</strong>,</p>
<p>Foi reportado um cão perdido na vossa área. Pedimos que verifiquem se o animal foi recolhido recentemente.</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Nome</td><td style="font-size:13px;font-weight:600">{dog_name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Raça</td><td style="font-size:13px">{breed}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Cor</td><td style="font-size:13px">{color}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Última localização</td><td style="font-size:13px">{zone}, {municipality}</td></tr>
</table>
{f'<p style="font-size:13px;color:#444">{description[:300]}</p>' if description else ''}
<p><a href="{case_url}" style="color:#4f46e5">Ver caso completo: {case_url}</a></p>
<p>Se tiverem o animal, por favor contactem o dono através do caso acima.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
<p style="font-size:11px;color:#999">SalvaCão — tecnologia gratuita para salvar cães no Algarve</p>
""",
        })
        log.info("Canil email sent", canil=canil_name, to=canil_email)
        return True
    except Exception as exc:
        log.error("Canil email failed", canil=canil_name, error=str(exc))
        return False


def send_vet_notification(vet_email: str, vet_name: str, case: dict) -> bool:
    """Email a vet clinic about a lost dog case. Returns True if sent."""
    if not _init():
        return False

    slug = case.get("slug", "")
    dog_name = case.get("dog_name") or "Sem nome"
    breed = case.get("breed", "indefinido")
    color = case.get("primary_color", "")
    municipality = case.get("last_seen_municipality", "")
    zone = case.get("last_seen_zone_approx", "")
    case_url = f"{_APP_URL}/pt/caso/{slug}"

    try:
        _resend.Emails.send({
            "from": _FROM,
            "to": vet_email,
            "subject": f"[SalvaCão] Cão perdido em {municipality} — alerta clínica veterinária",
            "html": f"""
<p>Olá equipa da <strong>{vet_name}</strong>,</p>
<p>Um cão perdido foi reportado na vossa área. Se o animal aparecer na clínica — encontrado por alguém ou trazido para tratamento — pedimos que contactem o dono pelo caso abaixo.</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Nome</td><td style="font-size:13px;font-weight:600">{dog_name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Raça</td><td style="font-size:13px">{breed}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Cor</td><td style="font-size:13px">{color}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;">Última localização</td><td style="font-size:13px">{zone}, {municipality}</td></tr>
</table>
<p><a href="{case_url}" style="color:#4f46e5">Ver caso: {case_url}</a></p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
<p style="font-size:11px;color:#999">SalvaCão — tecnologia gratuita para salvar cães no Algarve</p>
""",
        })
        log.info("Vet email sent", vet=vet_name, to=vet_email)
        return True
    except Exception as exc:
        log.error("Vet email failed", vet=vet_name, error=str(exc))
        return False
