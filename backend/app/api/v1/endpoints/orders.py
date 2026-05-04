from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.core.config import settings
from app.db.CRUD.orders import create_order, get_orders, get_order, update_order_status, get_orders_count, get_daily_order_summary
from app.db.CRUD.restaurant_settings import check_restaurant_availability
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.utils import send_email_smtp, verify_turnstile
from app.services.notification_service import NotificationManager, NotificationService
from app.api.v1.endpoints.websocket import broadcast_new_order_notification


router = APIRouter()


# ── Public: order tracking (no auth needed) ──────────────────────────────────

class OrderTrackRead(OrderRead):
    """Slim public view — same fields as OrderRead, just re-exported for clarity."""
    pass


@router.get("/track/{order_id}", response_model=OrderTrackRead)
def track_order(order_id: int, db: Session = Depends(get_db)):
    """Public endpoint: customer can look up their order status by ID."""
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return order


@router.get("/", response_model=list[OrderRead])
def list_orders(
    status: Optional[str] = Query(None, description="Filter by order status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    return get_orders(db, status=status, skip=skip, limit=limit)


@router.get("/count")
def orders_count(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    return {"count": get_orders_count(db, status=status)}


@router.get("/daily-summary")
def daily_summary(
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    """Get today's order summary: count, revenue, pending, average."""
    return get_daily_order_summary(db)


@router.get("/{order_id}", response_model=OrderRead)
def read_order(
    order_id: int,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderRead)
def change_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    try:
        order = update_order_status(db, order_id, body.status)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Trigger notification for order status change
    NotificationManager.notify_on_order_event(
        db=db,
        order=order,
        event_type="status_change",
        background_tasks=background_tasks,
    )

    # Send customer WhatsApp status update
    if settings.ENABLE_CUSTOMER_WHATSAPP_NOTIFICATIONS:
        tracking_url = f"{settings.CUSTOMER_APP_BASE_URL}/order/track/{order.id}"
        status_labels = {
            "confirmed": "Onaylandı ✅",
            "preparing": "Hazırlanıyor 👨‍🍳",
            "ready": "Hazır / Yolda 🚀",
            "delivered": "Teslim Edildi 🎉",
            "cancelled": "İptal Edildi ❌",
        }
        label = status_labels.get(order.status, order.status)
        customer_msg = (
            f"Merhaba {order.full_name}! Siparişinizin durumu güncellendi.\n\n"
            f"Sipariş #{order.id} → {label}\n\n"
            f"Takip linki: {tracking_url}"
        )
        background_tasks.add_task(
            NotificationService.send_whatsapp_notification,
            order.phone,
            customer_msg,
        )
    
    return order


@router.post("/", response_model=OrderRead)
def create_order_endpoint(
    order_in: OrderCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Enforce restaurant availability (temporary closure + working hours)
    availability = check_restaurant_availability(db)
    if not availability["is_open"]:
        raise HTTPException(status_code=403, detail=availability["reason"])

    try:
        created = create_order(
            db,
            order_in,
            client_ip=request.client.host if request.client else None,
            turnstile_verified_at=datetime.now(timezone.utc),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    subject = f"New order #{created.id} ({created.total} TRY)"
    lines = [
        f"Order ID: {created.id}",
        f"Total: {created.total} TRY",
        f"Customer: {created.full_name}",
        f"Phone: {created.phone}",
        f"Email: {created.email}",
        f"Address: {created.address_line1} {created.address_line2 or ''}",
    ]

    for it in created.items:
        lines.append(
            f"- {it.quantity} x {it.product_name_snapshot} ({it.quantity_code_snapshot} {it.unit_code_snapshot}) = {it.line_total} TRY"
        )

    body = "\n".join(lines)

    if settings.SHOP_OWNER_EMAIL and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        background_tasks.add_task(
            send_email_smtp,
            host=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            from_email=settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME,
            to_email=settings.SHOP_OWNER_EMAIL,
            subject=subject,
            body=body,
        )

    # Admin notification (WhatsApp / SMS / email via preferences)
    NotificationManager.notify_on_order_event(
        db=db,
        order=created,
        event_type="new_order",
        background_tasks=background_tasks,
    )

    # Customer WhatsApp confirmation with tracking link
    if settings.ENABLE_CUSTOMER_WHATSAPP_NOTIFICATIONS:
        tracking_url = f"{settings.CUSTOMER_APP_BASE_URL}/order/track/{created.id}"
        customer_msg = (
            f"Merhaba {created.full_name}! 🎉\n\n"
            f"Siparişiniz alındı. Sipariş numaranız: #{created.id}\n"
            f"Toplam: {created.total} TRY\n\n"
            f"Siparişinizi takip etmek için:\n{tracking_url}"
        )
        background_tasks.add_task(
            NotificationService.send_whatsapp_notification,
            created.phone,
            customer_msg,
        )

    # Broadcast real-time WebSocket notification to admin panel
    background_tasks.add_task(broadcast_new_order_notification, created)

    return created
