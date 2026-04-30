import asyncio
import logging
from datetime import datetime, time
from typing import Optional
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification, NotificationChannel, NotificationStatus, NotificationPreference
from app.models.order import Order
from app.utils import send_email_smtp

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling all notification operations"""
    
    @staticmethod
    def get_notification_preference(db: Session) -> Optional[NotificationPreference]:
        """Get the restaurant's notification preferences"""
        try:
            return db.query(NotificationPreference).first()
        except Exception as e:
            logger.warning(f"Could not fetch notification preferences (tables may not exist): {e}")
            return None
    
    @staticmethod
    def should_send_notification(db: Session) -> bool:
        """Check if we should send notifications based on quiet hours"""
        try:
            prefs = NotificationService.get_notification_preference(db)
            if not prefs or not prefs.enable_quiet_hours:
                return True
            
            now = datetime.now().time()
            start = datetime.strptime(prefs.quiet_hours_start or "22:00", "%H:%M").time()
            end = datetime.strptime(prefs.quiet_hours_end or "08:00", "%H:%M").time()
            
            # Handle case where quiet hours cross midnight
            if start > end:
                return not (now >= start or now < end)
            else:
                return not (start <= now < end)
        except Exception as e:
            logger.error(f"Error checking quiet hours: {e}")
            return True
    
    @staticmethod
    async def send_sms_notification(
        phone: str, 
        message: str
    ) -> tuple[bool, Optional[str]]:
        """Send SMS via Twilio"""
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_PHONE_NUMBER:
            logger.warning("Twilio SMS not configured")
            return False, "Twilio SMS not configured"
        
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            message_obj = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone
            )
            
            logger.info(f"SMS sent successfully. SID: {message_obj.sid}")
            return True, message_obj.sid
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return False, str(e)
    
    @staticmethod
    async def send_whatsapp_notification(
        phone: str,
        message: str
    ) -> tuple[bool, Optional[str]]:
        """Send WhatsApp message via Twilio"""
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_WHATSAPP_NUMBER:
            logger.warning("Twilio WhatsApp not configured")
            return False, "Twilio WhatsApp not configured"
        
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            message_obj = client.messages.create(
                body=message,
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
                to=f"whatsapp:{phone}"
            )
            
            logger.info(f"WhatsApp sent successfully. SID: {message_obj.sid}")
            return True, message_obj.sid
        except Exception as e:
            logger.error(f"Failed to send WhatsApp: {str(e)}")
            return False, str(e)
    
    @staticmethod
    async def send_voice_notification(
        phone: str,
        message: str
    ) -> tuple[bool, Optional[str]]:
        """Send voice notification via Twilio"""
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_PHONE_NUMBER:
            logger.warning("Twilio Voice not configured")
            return False, "Twilio Voice not configured"
        
        try:
            from twilio.rest import Client
            from twilio.twiml.voice_response import VoiceResponse
            
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            # Create TwiML response with text-to-speech
            response = VoiceResponse()
            response.say(message, voice='woman', language='tr-TR')  # Turkish voice
            
            call = client.calls.create(
                to=phone,
                from_=settings.TWILIO_PHONE_NUMBER,
                twiml=str(response)
            )
            
            logger.info(f"Voice call initiated successfully. SID: {call.sid}")
            return True, call.sid
        except Exception as e:
            logger.error(f"Failed to send voice notification: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def send_email_notification(
        to_email: str,
        subject: str,
        body: str
    ) -> bool:
        """Send email notification"""
        if not settings.SHOP_OWNER_EMAIL or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            logger.warning("Email notification not configured")
            return False
        
        try:
            send_email_smtp(
                host=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD,
                from_email=settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME,
                to_email=to_email,
                subject=subject,
                body=body,
            )
            logger.info(f"Email notification sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")
            return False


class NotificationManager:
    """Manager for creating and sending notifications"""
    
    @staticmethod
    def create_notification(
        db: Session,
        order_id: int,
        channel: NotificationChannel,
        recipient: str,
        message: str,
        subject: Optional[str] = None,
    ) -> Notification:
        """Create a notification record in the database"""
        notification = Notification(
            order_id=order_id,
            channel=channel,
            recipient=recipient,
            subject=subject,
            message=message,
            status=NotificationStatus.PENDING,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    
    @staticmethod
    async def send_notification_async(
        db: Session,
        notification_id: int,
        retry_count: int = 0,
    ) -> None:
        """Send a notification asynchronously with retry logic"""
        try:
            notification = db.query(Notification).filter(
                Notification.id == notification_id
            ).first()
            
            if not notification:
                logger.error(f"Notification {notification_id} not found")
                return
            
            # Check quiet hours
            if not NotificationService.should_send_notification(db):
                logger.info(f"Skipping notification {notification_id} due to quiet hours")
                notification.status = NotificationStatus.PENDING
                db.commit()
                return
            
            success = False
            error_message = None
            external_id = None
            
            try:
                if notification.channel == NotificationChannel.EMAIL:
                    success = NotificationService.send_email_notification(
                        to_email=notification.recipient,
                        subject=notification.subject or "Order Notification",
                        body=notification.message,
                    )
                
                elif notification.channel == NotificationChannel.SMS:
                    success, external_id = await NotificationService.send_sms_notification(
                        phone=notification.recipient,
                        message=notification.message,
                    )
                    notification.twilio_message_sid = external_id
                
                elif notification.channel == NotificationChannel.WHATSAPP:
                    success, external_id = await NotificationService.send_whatsapp_notification(
                        phone=notification.recipient,
                        message=notification.message,
                    )
                    notification.twilio_message_sid = external_id
                
                elif notification.channel == NotificationChannel.VOICE:
                    success, external_id = await NotificationService.send_voice_notification(
                        phone=notification.recipient,
                        message=notification.message,
                    )
                    notification.twilio_call_sid = external_id
                
                if success:
                    notification.status = NotificationStatus.SENT
                    notification.sent_at = datetime.utcnow()
                    notification.retry_count = 0
                else:
                    raise Exception(error_message or "Failed to send notification")
            
            except Exception as e:
                error_message = str(e)
                notification.error_message = error_message
                notification.retry_count = retry_count + 1
                
                if notification.retry_count < settings.NOTIFICATION_RETRY_ATTEMPTS:
                    notification.status = NotificationStatus.RETRYING
                    # Schedule retry
                    await asyncio.sleep(settings.NOTIFICATION_RETRY_DELAY_SECONDS)
                    await NotificationManager.send_notification_async(
                        db, notification_id, notification.retry_count
                    )
                else:
                    notification.status = NotificationStatus.FAILED
                    logger.error(f"Notification {notification_id} failed after {notification.retry_count} retries: {error_message}")
            
            db.commit()
        
        except Exception as e:
            logger.error(f"Error in send_notification_async: {str(e)}")
    
    @staticmethod
    def notify_on_order_event(
        db: Session,
        order: Order,
        event_type: str,  # "new_order", "status_change", "delivery_completed"
        background_tasks: BackgroundTasks,
    ) -> None:
        """Send notifications for order events"""
        prefs = NotificationService.get_notification_preference(db)
        
        if not prefs:
            logger.warning("No notification preferences configured")
            return
        
        # Check if this event type should trigger notifications
        if event_type == "new_order" and not prefs.notify_on_new_order:
            return
        elif event_type == "status_change" and not prefs.notify_on_status_change:
            return
        elif event_type == "delivery_completed" and not prefs.notify_on_delivery_completed:
            return
        
        # Prepare notification message
        subject, message = NotificationManager.prepare_notification_message(order, event_type)
        
        # Send via enabled channels
        channels_to_send = []
        
        if prefs.enable_email and prefs.admin_email:
            channels_to_send.append((NotificationChannel.EMAIL, prefs.admin_email))
        
        if prefs.enable_sms and prefs.admin_phone and settings.ENABLE_SMS_NOTIFICATIONS:
            channels_to_send.append((NotificationChannel.SMS, prefs.admin_phone))
        
        if prefs.enable_whatsapp and prefs.admin_whatsapp and settings.ENABLE_WHATSAPP_NOTIFICATIONS:
            channels_to_send.append((NotificationChannel.WHATSAPP, prefs.admin_whatsapp))
        
        if prefs.enable_voice and prefs.admin_phone and settings.ENABLE_VOICE_NOTIFICATIONS:
            channels_to_send.append((NotificationChannel.VOICE, prefs.admin_phone))
        
        # Create notifications and schedule sending
        for channel, recipient in channels_to_send:
            notification = NotificationManager.create_notification(
                db=db,
                order_id=order.id,
                channel=channel,
                recipient=recipient,
                message=message,
                subject=subject,
            )
            # Add async task to send notification
            background_tasks.add_task(
                NotificationManager.send_notification_async,
                db,
                notification.id,
            )
    
    @staticmethod
    def prepare_notification_message(order: Order, event_type: str) -> tuple[str, str]:
        """Prepare notification subject and message based on order event"""
        if event_type == "new_order":
            subject = f"New Order #{order.id} - {order.total} TRY"
            message = f"New order received!\n\nOrder ID: {order.id}\nTotal: {order.total} TRY\nCustomer: {order.full_name}\nPhone: {order.phone}\nAddress: {order.address_line1}"
        
        elif event_type == "status_change":
            subject = f"Order #{order.id} Status Changed to {order.status}"
            message = f"Order status updated!\n\nOrder ID: {order.id}\nNew Status: {order.status}\nCustomer: {order.full_name}"
        
        elif event_type == "delivery_completed":
            subject = f"Order #{order.id} Delivered"
            message = f"Order has been delivered!\n\nOrder ID: {order.id}\nCustomer: {order.full_name}\nTotal: {order.total} TRY"
        
        else:
            subject = f"Order #{order.id} Notification"
            message = f"Order notification\n\nOrder ID: {order.id}"
        
        return subject, message

