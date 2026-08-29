import os
import logging
import httpx
from html import escape
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip().rstrip("/") or "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME") or "ASKOOL"


def _wrap(inner: str) -> str:
    brand = escape(EMAIL_FROM_NAME)
    return (
        f'<table role="presentation" width="100%" style="background:#FDFBF7;padding:24px">'
        f'<tr><td align="center">'
        f'<table role="presentation" width="560" style="background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,sans-serif">'
        f'<tr><td style="background:#2a4898;padding:20px 28px"><span style="color:#fff;font-size:22px;font-weight:bold">ASKOOL</span></td></tr>'
        f'<tr><td style="padding:28px">{inner}'
        f'<p style="font-size:12px;color:#888;margin-top:28px">Envoyé par {brand}. Nous ne vous demanderons jamais votre mot de passe par email.</p>'
        f'</td></tr></table></td></tr></table>'
    )


async def _send(to_email: str, subject: str, html: str) -> bool:
    if not EMAIL_KEY or EMAIL_KEY.startswith("{"):
        logger.warning("Email not configured; skipping send to %s", to_email)
        return False
    try:
        async with httpx.AsyncClient(timeout=30) as clientx:
            resp = await clientx.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json={"to": [to_email], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME},
            )
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


async def send_password_reset_email(to_email: str, token: str) -> bool:
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    link = f"{base}/reset-password?token={token}"
    if not EMAIL_KEY or EMAIL_KEY.startswith("{") or not base.startswith("https://"):
        if urlparse(base).hostname in ("localhost", "127.0.0.1", "::1"):
            logger.warning("Email not configured; password reset link: %s", link)
        else:
            logger.error("Password reset email not configured (EMERGENT_EMAIL_KEY / FRONTEND_URL)")
        return False
    inner = (
        f'<p>Nous avons reçu une demande de réinitialisation de votre mot de passe ASKOOL.</p>'
        f'<p style="margin:24px 0"><a href="{escape(link)}" style="background:#2a4898;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;display:inline-block">Réinitialiser mon mot de passe</a></p>'
        f'<p>Ce lien expire dans 1 heure et ne peut être utilisé qu\'une seule fois. Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.</p>'
    )
    return await _send(to_email, "Réinitialisez votre mot de passe ASKOOL", _wrap(inner))


async def send_verification_email(to_email: str, token: str, name: str = "") -> bool:
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    link = f"{base}/verify-email?token={token}"
    if not EMAIL_KEY or EMAIL_KEY.startswith("{") or not base.startswith("https://"):
        if urlparse(base).hostname in ("localhost", "127.0.0.1", "::1"):
            logger.warning("Email not configured; verification link: %s", link)
        return False
    inner = (
        f'<p>Bienvenue sur ASKOOL{(" " + escape(name)) if name else ""} !</p>'
        f'<p>Confirmez votre adresse email pour activer toutes les fonctionnalités de votre compte.</p>'
        f'<p style="margin:24px 0"><a href="{escape(link)}" style="background:#F8BF0E;color:#111827;text-decoration:none;padding:12px 24px;border-radius:12px;display:inline-block;font-weight:bold">Confirmer mon email</a></p>'
        f'<p>Ce lien expire dans 24 heures.</p>'
    )
    return await _send(to_email, "Confirmez votre adresse email ASKOOL", _wrap(inner))


async def send_payment_receipt_email(to_email: str, name: str, pay: dict, receipts_url: str = "") -> bool:
    if not to_email or not EMAIL_KEY or EMAIL_KEY.startswith("{"):
        logger.warning("Receipt email skipped (not configured) for %s", to_email)
        return False
    amount = f"{int(pay.get('amount', 0)):,}".replace(",", " ")
    currency = escape(str(pay.get("currency", "XOF")))
    label = escape(str(pay.get("label", "Paiement")))
    provider = escape(str(pay.get("provider", "Mobile Money")))
    pid = escape(str(pay.get("payment_id", "")))
    date = escape(str(pay.get("confirmed_at") or pay.get("created_at", "")))
    row = lambda k, v: (f'<tr><td style="padding:6px 0;color:#666;font-size:14px">{k}</td>'
                        f'<td style="padding:6px 0;text-align:right;font-weight:bold;color:#111827;font-size:14px">{v}</td></tr>')
    btn = ""
    if receipts_url.startswith("https://"):
        btn = (f'<p style="margin:24px 0"><a href="{escape(receipts_url)}" '
               f'style="background:#2a4898;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;display:inline-block;font-weight:bold">Télécharger le reçu (PDF)</a></p>')
    inner = (
        f'<p>Bonjour{(" " + escape(name)) if name else ""},</p>'
        f'<p>Merci ! Votre paiement a bien été confirmé. Voici votre reçu :</p>'
        f'<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:12px">'
        f'{row("Reçu N°", pid)}{row("Date", date)}{row("Description", label)}'
        f'{row("Moyen de paiement", provider)}'
        f'<tr><td style="padding:12px 0 0;border-top:1px solid #eee;font-size:16px;font-weight:bold;color:#2a4898">Total payé</td>'
        f'<td style="padding:12px 0 0;border-top:1px solid #eee;text-align:right;font-size:16px;font-weight:bold;color:#2a4898">{amount} {currency}</td></tr>'
        f'</table>'
        f'{btn}'
        f'<p style="font-size:13px;color:#888">Vous pouvez retrouver et télécharger tous vos reçus depuis votre espace ASKOOL.</p>'
    )
    return await _send(to_email, f"Votre reçu ASKOOL — {label}", _wrap(inner))
