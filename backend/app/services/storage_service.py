"""Object storage for product images.

Uses Supabase Storage when configured (persistent across deploys/restarts),
which fixes the ephemeral-filesystem problem on PaaS hosts like Render.
"""
import httpx

from app.core.config import settings


def is_supabase_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)


def upload_image_to_supabase(object_name: str, contents: bytes, content_type: str) -> str:
    """Upload bytes to the configured Supabase Storage bucket and return the public URL.

    The bucket must be marked public in the Supabase dashboard so the returned
    URL is directly viewable.
    """
    base = settings.SUPABASE_URL.rstrip("/")
    bucket = settings.SUPABASE_STORAGE_BUCKET
    upload_url = f"{base}/storage/v1/object/{bucket}/{object_name}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    resp = httpx.post(upload_url, content=contents, headers=headers, timeout=30.0)
    if resp.status_code not in (200, 201):
        raise RuntimeError(
            f"Supabase upload failed ({resp.status_code}): {resp.text}"
        )

    return f"{base}/storage/v1/object/public/{bucket}/{object_name}"
