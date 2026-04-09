from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum


class NotificationChannelEnum(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOICE = "voice"


class NotificationStatusEnum(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    RETRYING = "retrying"
    ACKNOWLEDGED = "acknowledged"


class NotificationRead(BaseModel):
    id: int
    order_id: int
    channel: NotificationChannelEnum
    status: NotificationStatusEnum
    recipient: str
    subject: Optional[str]
    message: str
    sent_at: Optional[datetime]
    created_at: datetime
    retry_count: int
    error_message: Optional[str]
    is_read: bool
    is_acknowledged: bool
    twilio_message_sid: Optional[str]
    twilio_call_sid: Optional[str]

    class Config:
        from_attributes = True


class NotificationPreferenceRead(BaseModel):
    id: int
    admin_email: str
    admin_phone: Optional[str]
    admin_whatsapp: Optional[str]
    enable_email: bool
    enable_sms: bool
    enable_whatsapp: bool
    enable_voice: bool
    notify_on_new_order: bool
    notify_on_status_change: bool
    notify_on_delivery_completed: bool
    enable_quiet_hours: bool
    quiet_hours_start: Optional[str]
    quiet_hours_end: Optional[str]

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    admin_email: Optional[str] = None
    admin_phone: Optional[str] = None
    admin_whatsapp: Optional[str] = None
    enable_email: Optional[bool] = None
    enable_sms: Optional[bool] = None
    enable_whatsapp: Optional[bool] = None
    enable_voice: Optional[bool] = None
    notify_on_new_order: Optional[bool] = None
    notify_on_status_change: Optional[bool] = None
    notify_on_delivery_completed: Optional[bool] = None
    enable_quiet_hours: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class NotificationMarkAsRead(BaseModel):
    is_read: bool


class NotificationAcknowledge(BaseModel):
    is_acknowledged: bool

