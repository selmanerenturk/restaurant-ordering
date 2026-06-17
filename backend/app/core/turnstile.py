import httpx
from fastapi import HTTPException, status
from app.core.config import settings

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str | None) -> bool:
    """Verify a Cloudflare Turnstile token. Fail-closed: any doubt -> reject.

    Only skips when no secret key is configured at all (local dev). There are
    deliberately NO bypass/escape tokens — a client cannot opt out of the check.
    """
    if not settings.TURNSTILE_SECRET_KEY:
        return True  # verification disabled (no key configured, e.g. local dev)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CAPTCHA verification required.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                TURNSTILE_VERIFY_URL,
                data={
                    "secret": settings.TURNSTILE_SECRET_KEY,
                    "response": token,
                },
            )
        result = response.json()
    except Exception:
        # Network/parse error talking to Cloudflare -> reject (fail-closed)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CAPTCHA verification failed. Please try again.",
        )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CAPTCHA verification failed. Please try again.",
        )
    return True