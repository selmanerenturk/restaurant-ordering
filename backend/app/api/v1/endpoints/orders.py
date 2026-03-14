from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.core.config import settings
from app.db.CRUD.orders import create_order
from app.schemas.order import OrderCreate, OrderRead
from app.utils import send_email_smtp, verify_turnstile


router = APIRouter()


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
