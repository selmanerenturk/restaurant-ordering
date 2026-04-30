from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from app.models.notification import Notification, NotificationPreference, NotificationStatus
from app.schemas.notification import NotificationPreferenceUpdate


def get_notifications(
    db: Session,
    order_id: Optional[int] = None,
    status: Optional[str] = None,
    is_read: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Notification]:
    """Get notifications with optional filters"""
    query = db.query(Notification).order_by(desc(Notification.created_at))
    
    if order_id:
        query = query.filter(Notification.order_id == order_id)
    
    if status:
        query = query.filter(Notification.status == status)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    return query.offset(skip).limit(limit).all()


def get_notification(db: Session, notification_id: int) -> Optional[Notification]:
    """Get a single notification by ID"""
    return db.query(Notification).filter(
        Notification.id == notification_id
    ).first()


def get_unread_notification_count(db: Session) -> int:
    """Get count of unread notifications"""
    return db.query(Notification).filter(
        Notification.is_read == False
    ).count()


def mark_notification_as_read(db: Session, notification_id: int, is_read: bool = True) -> Optional[Notification]:
    """Mark a notification as read"""
    notification = get_notification(db, notification_id)
    if notification:
        notification.is_read = is_read
        db.commit()
        db.refresh(notification)
    return notification


def acknowledge_notification(db: Session, notification_id: int, is_acknowledged: bool = True) -> Optional[Notification]:
    """Mark a notification as acknowledged"""
    notification = get_notification(db, notification_id)
    if notification:
        notification.is_acknowledged = is_acknowledged
        if is_acknowledged:
            notification.status = NotificationStatus.ACKNOWLEDGED
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_as_read(db: Session) -> int:
    """Mark all notifications as read"""
    result = db.query(Notification).filter(
        Notification.is_read == False
    ).update({Notification.is_read: True})
    db.commit()
    return result


def delete_notification(db: Session, notification_id: int) -> bool:
    """Delete a notification"""
    notification = get_notification(db, notification_id)
    if notification:
        db.delete(notification)
        db.commit()
        return True
    return False


def get_or_create_notification_preference(db: Session) -> NotificationPreference:
    """Get or create notification preferences for the restaurant"""
    prefs = db.query(NotificationPreference).first()
    
    if not prefs:
        prefs = NotificationPreference(
            restaurant_id=1,
            admin_email="admin@restaurant.com",
            admin_phone=None,
            admin_whatsapp=None,
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return prefs


def get_notification_preference(db: Session) -> Optional[NotificationPreference]:
    """Get notification preferences"""
    return db.query(NotificationPreference).first()


def update_notification_preference(
    db: Session,
    preference_update: NotificationPreferenceUpdate,
) -> NotificationPreference:
    """Update notification preferences"""
    prefs = get_or_create_notification_preference(db)
    
    update_data = preference_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(prefs, field, value)
    
    db.commit()
    db.refresh(prefs)
    return prefs


def get_failed_notifications(db: Session, limit: int = 10) -> List[Notification]:
    """Get recent failed notifications for monitoring"""
    return db.query(Notification).filter(
        Notification.status == NotificationStatus.FAILED
    ).order_by(desc(Notification.created_at)).limit(limit).all()


def get_pending_notifications(db: Session, limit: int = 10) -> List[Notification]:
    """Get pending notifications to be sent"""
    return db.query(Notification).filter(
        Notification.status == NotificationStatus.PENDING
    ).order_by(Notification.created_at).limit(limit).all()

