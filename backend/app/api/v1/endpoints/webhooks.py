from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import settings
from app.db.CRUD.notifications import update_notification_status_by_twilio_sid

router = APIRouter()


@router.post("/twilio/status")
async def twilio_message_status_callback(
    request: Request,
    x_twilio_signature: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Receive Twilio status callback events for SMS/WhatsApp messages."""
    form = await request.form()

    if settings.TWILIO_VALIDATE_WEBHOOK_SIGNATURE:
        if not x_twilio_signature:
            raise HTTPException(status_code=400, detail="Missing Twilio signature")
        from twilio.request_validator import RequestValidator

        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN or "")
        is_valid = validator.validate(
            str(request.url),
            {k: str(v) for k, v in form.items()},
            x_twilio_signature,
        )
        if not is_valid:
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    message_sid = form.get("MessageSid")
    message_status = form.get("MessageStatus")
    error_code = form.get("ErrorCode")
    error_message = form.get("ErrorMessage")

    if not message_sid or not message_status:
        raise HTTPException(status_code=400, detail="MessageSid and MessageStatus are required")

    updated = update_notification_status_by_twilio_sid(
        db=db,
        message_sid=message_sid,
        twilio_status=message_status,
        error_code=error_code,
        error_message=error_message,
    )

    return {
        "ok": True,
        "updated": updated is not None,
        "message_sid": message_sid,
        "status": message_status,
    }

