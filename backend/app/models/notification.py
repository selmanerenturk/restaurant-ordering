from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class NotificationChannel(str, enum.Enum):
    """Notification delivery channels"""
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOICE = "voice"


class NotificationStatus(str, enum.Enum):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    RETRYING = "retrying"
    ACKNOWLEDGED = "acknowledged"


class Notification(Base):
    """Notification record for each order event"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    channel = Column(Enum(NotificationChannel), nullable=False, default=NotificationChannel.EMAIL)
    status = Column(Enum(NotificationStatus), nullable=False, default=NotificationStatus.PENDING)
    
    recipient = Column(String, nullable=False)  # Phone number, email, etc.
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    retry_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    is_read = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False)
    
    # External reference for Twilio
    twilio_message_sid = Column(String, nullable=True)
    twilio_call_sid = Column(String, nullable=True)


class NotificationPreference(Base):
    """Admin notification preferences"""
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, unique=True)  # For multi-restaurant support in future
    
    admin_email = Column(String, nullable=False)
    admin_phone = Column(String, nullable=True)
    admin_whatsapp = Column(String, nullable=True)
    
    enable_email = Column(Boolean, default=True)
    enable_sms = Column(Boolean, default=False)
    enable_whatsapp = Column(Boolean, default=False)
    enable_voice = Column(Boolean, default=False)
    
    # Notification triggers
    notify_on_new_order = Column(Boolean, default=True)
    notify_on_status_change = Column(Boolean, default=True)
    notify_on_delivery_completed = Column(Boolean, default=True)
    
    # Quiet hours (don't send notifications outside working hours)
    enable_quiet_hours = Column(Boolean, default=True)
    quiet_hours_start = Column(String, nullable=True, default="22:00")  # HH:MM format
    quiet_hours_end = Column(String, nullable=True, default="08:00")    # HH:MM format
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

