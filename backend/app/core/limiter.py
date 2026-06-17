"""Shared rate limiter (slowapi).

Public write endpoints (login, order creation) each cost something — a DB row,
an email, an SMS, a CAPTCHA round-trip — so they must be rate limited per IP to
prevent brute-force and spam/DoS abuse.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_client_ip(request) -> str:
    """Real client IP. On Render (and most PaaS) the app sits behind a proxy,
    so the true IP is the first entry in X-Forwarded-For; fall back to the
    socket peer for local/direct connections."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)
