from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.notifications import (
    get_notifications,
    get_notification,
    mark_notification_as_read,
    acknowledge_notification,
    mark_all_as_read,
    delete_notification,
    get_notification_preference,
    update_notification_preference,
    get_unread_notification_count,
    get_or_create_notification_preference,
)
from app.schemas.notification import (
    NotificationRead,
    NotificationPreferenceRead,
    NotificationPreferenceUpdate,
    NotificationMarkAsRead,
    NotificationAcknowledge,
)
from app.services.notification_service import NotificationManager

router = APIRouter()


@router.get("/", response_model=list[NotificationRead])
def list_notifications(
    order_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Get all notifications with optional filters"""
    return get_notifications(
        db,
        order_id=order_id,
        status=status,
        is_read=is_read,
        skip=skip,
        limit=limit,
    )


@router.get("/count/unread")
def unread_notifications_count(
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Get count of unread notifications"""
    return {"unread_count": get_unread_notification_count(db)}


@router.get("/{notification_id}", response_model=NotificationRead)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Get a specific notification by ID"""
    notification = get_notification(db, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    body: NotificationMarkAsRead,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Mark a notification as read/unread"""
    notification = mark_notification_as_read(db, notification_id, body.is_read)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "is_read": notification.is_read}


@router.patch("/{notification_id}/acknowledge")
def acknowledge_notif(
    notification_id: int,
    body: NotificationAcknowledge,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Acknowledge a notification"""
    notification = acknowledge_notification(db, notification_id, body.is_acknowledged)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "is_acknowledged": notification.is_acknowledged}


@router.post("/mark-all-read")
def mark_all_read_endpoint(
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Mark all notifications as read"""
    count = mark_all_as_read(db)
    return {"status": "success", "marked_count": count}


@router.delete("/{notification_id}")
def delete_notif(
    notification_id: int,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Delete a notification"""
    success = delete_notification(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}


@router.get("/preferences/current", response_model=NotificationPreferenceRead)
def get_preferences(
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Get current notification preferences"""
    prefs = get_or_create_notification_preference(db)
    return prefs


@router.patch("/preferences/update", response_model=NotificationPreferenceRead)
def update_preferences(
    preference_update: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Update notification preferences"""
    prefs = update_notification_preference(db, preference_update)
    return prefs


@router.post("/test-notification")
def test_notification(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Send a test notification (for configuration testing)"""
    prefs = get_notification_preference(db)
    
    if not prefs or not prefs.admin_email:
        raise HTTPException(status_code=400, detail="No notification preferences configured")
    
    # Create a mock order object for testing
    class MockOrder:
        id = 0
        total = 0.0
        full_name = "Test Customer"
        phone = "+90 555 0000000"
        address_line1 = "Test Address"
    
    NotificationManager.notify_on_order_event(
        db=db,
        order=MockOrder(),
        event_type="new_order",
        background_tasks=background_tasks,
    )
    
    return {"status": "success", "message": "Test notification sent"}

