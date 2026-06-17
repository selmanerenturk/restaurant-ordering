from __future__ import annotations

import ssl
import smtplib
from email.message import EmailMessage


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
