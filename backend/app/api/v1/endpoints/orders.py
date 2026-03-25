from datetime import datetime
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.core.config import settings
from app.db.CRUD.orders import create_order, get_orders, get_order, update_order_status, get_orders_count
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.utils import send_email_smtp, verify_turnstile


router = APIRouter()


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
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    try:
        order = update_order_status(db, order_id, body.status)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=OrderRead)
def create_order_endpoint(
    order_in: OrderCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):

    try:
        created = create_order(
            db,
            order_in,
            client_ip=request.client.host if request.client else None,
            turnstile_verified_at=datetime.utcnow(),
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

    return created
