from __future__ import annotations

import json
import ssl
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def verify_turnstile(*, secret_key: str, token: str, remoteip: str | None) -> bool:
    data = {"secret": secret_key, "response": token}
    if remoteip:
        data["remoteip"] = remoteip

    req = Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=urlencode(data).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    with urlopen(req, timeout=5) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    return bool(payload.get("success"))


def send_email_smtp(
    *,
    host: str,
    port: int,
    username: str,
    password: str,
    from_email: str,
    to_email: str,
    subject: str,
    body: str,
) -> None:
    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()

    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls(context=context)
        smtp.login(username, password)
        smtp.send_message(msg)
