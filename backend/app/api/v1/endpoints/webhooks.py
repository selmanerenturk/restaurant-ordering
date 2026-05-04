import logging
from fastapi import APIRouter, Request, Response, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends

from app.api.dependencies import get_db
from app.core.config import settings
from app.models.notification import Notification, NotificationStatus

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/twilio/status")
async def twilio_status_callback(request: Request, db: Session = Depends(get_db)):
    """
    Twilio status callback webhook.
    Twilio calls this URL when a message status changes (sent, delivered, failed, etc.)
    """
    try:
        form_data = await request.form()
        message_sid = form_data.get("MessageSid")
        message_status = form_data.get("MessageStatus")  # sent, delivered, failed, undelivered
        error_code = form_data.get("ErrorCode")

        logger.info(f"Twilio webhook: SID={message_sid}, Status={message_status}, ErrorCode={error_code}")

        if message_sid and message_status:
            # Update notification status in DB
            notification = db.query(Notification).filter(
                Notification.twilio_message_sid == message_sid
            ).first()

            if notification:
                if message_status in ("delivered",):
                    notification.status = NotificationStatus.DELIVERED
                elif message_status in ("failed", "undelivered"):
                    notification.status = NotificationStatus.FAILED
                    notification.error_message = f"Twilio error code: {error_code}"
                elif message_status in ("sent",):
                    notification.status = NotificationStatus.SENT

                db.commit()
                logger.info(f"Updated notification {notification.id} status to {notification.status}")

        # Twilio expects an empty 200 response
        return Response(content="", status_code=200)

    except Exception as e:
        logger.error(f"Error processing Twilio webhook: {e}")
        return Response(content="", status_code=200)  # Always return 200 to Twilio

