from __future__ import annotations

from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, func as sa_func
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.order_item_option import OrderItemOption
from app.models.product_price import ProductPrice
from app.models.product import Product
from app.models.product_option import ProductOptionItem
from app.schemas.order import OrderCreate


VALID_STATUSES = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled", "returned"]
PENDING_STATUSES = ["new", "confirmed", "preparing"]


def get_daily_order_summary(db: Session) -> dict:
    """Get today's order summary metrics in a single query."""
    today_start = datetime.combine(date.today(), datetime.min.time())

    result = db.query(
        sa_func.count(Order.id).label("today_order_count"),
        sa_func.coalesce(sa_func.sum(Order.total), 0).label("today_revenue"),
        sa_func.coalesce(
            sa_func.sum(Order.total) / sa_func.nullif(sa_func.count(Order.id), 0),
            0,
        ).label("avg_order_amount"),
    ).filter(
        Order.created_at >= today_start,
        Order.status.notin_(["cancelled", "returned"]),
    ).first()

    pending_count = db.query(sa_func.count(Order.id)).filter(
        Order.status.in_(PENDING_STATUSES),
    ).scalar() or 0

    return {
        "today_order_count": result.today_order_count if result else 0,
        "today_revenue": float(result.today_revenue) if result else 0.0,
        "avg_order_amount": round(float(result.avg_order_amount), 2) if result else 0.0,
        "pending_order_count": pending_count,
    }


def get_orders(
    db: Session,
    *,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Order]:
    query = db.query(Order).options(
        selectinload(Order.items).selectinload(OrderItem.selected_options)
    )
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.selected_options))
        .filter(Order.id == order_id)
        .first()
    )


def update_order_status(db: Session, order_id: int, new_status: str) -> Optional[Order]:
    if new_status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of: {VALID_STATUSES}")
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        return None
    order.status = new_status
    db.commit()
    db.refresh(order)
    return (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.selected_options))
        .filter(Order.id == order_id)
        .first()
    )


def get_orders_count(db: Session, *, status: Optional[str] = None) -> int:
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.count()


def create_order(db: Session, order_in: OrderCreate, *, client_ip: str | None, turnstile_verified_at: datetime | None) -> Order:
    price_ids = [i.product_price_id for i in order_in.items]

    prices = (
        db.query(ProductPrice)
        .options(selectinload(ProductPrice.product))
        .filter(ProductPrice.id.in_(price_ids))
        .all()
    )
    prices_by_id = {p.id: p for p in prices}

    missing = [pid for pid in price_ids if pid not in prices_by_id]
    if missing:
        raise ValueError(f"Unknown product_price_id(s): {sorted(set(missing))}")

    for p in prices:
        if p.currency_code != "TRY":
            raise ValueError("Only TRY currency is supported")
        if p.product is None:
            raise ValueError("Invalid product price configuration")
        if not p.product.instock:
            raise ValueError(f"Product out of stock: {p.product.name}")

    subtotal = Decimal("0.00")
    order_items: list[OrderItem] = []

    # Pre-load all referenced option items in one query
    all_option_item_ids = []
    for item in order_in.items:
        for sel in item.selected_options:
            all_option_item_ids.append(sel.option_item_id)

    option_items_by_id = {}
    if all_option_item_ids:
        oi_rows = (
            db.query(ProductOptionItem)
            .options(selectinload(ProductOptionItem.option))
            .filter(ProductOptionItem.id.in_(all_option_item_ids))
            .all()
        )
        option_items_by_id = {oi.id: oi for oi in oi_rows}

    for item in order_in.items:
        p = prices_by_id[item.product_price_id]
        unit_price = Decimal(p.price)

        # Calculate extra price from selected options
        options_extra = Decimal("0.00")
        item_option_snapshots: list[OrderItemOption] = []
        for sel in item.selected_options:
            oi = option_items_by_id.get(sel.option_item_id)
            if oi is None:
                raise ValueError(f"Unknown option_item_id: {sel.option_item_id}")
            if not sel.is_removed:
                options_extra += Decimal(str(oi.extra_price))
            item_option_snapshots.append(
                OrderItemOption(
                    option_name_snapshot=oi.option.name if oi.option else "",
                    item_name_snapshot=oi.name,
                    extra_price_snapshot=oi.extra_price,
                    currency_code_snapshot=oi.currency_code,
                    is_removed=sel.is_removed,
                )
            )

        qty = Decimal(item.quantity)
        line_total = ((unit_price + options_extra) * qty).quantize(Decimal("0.01"))
        subtotal += line_total

        order_items.append(
            OrderItem(
                product_id=p.product_id,
                product_price_id=p.id,
                product_name_snapshot=p.product.name,
                quantity_code_snapshot=p.quantity_code,
                unit_code_snapshot=p.unit_code,
                unit_price_snapshot=p.price,
                currency_code_snapshot=p.currency_code,
                quantity=item.quantity,
                line_total=line_total,
                selected_options=item_option_snapshots,
            )
        )

    subtotal = subtotal.quantize(Decimal("0.01"))
    delivery_fee = Decimal("0.00")
    total = (subtotal + delivery_fee).quantize(Decimal("0.01"))

    order = Order(
        status="confirmed",
        currency_code="TRY",
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        full_name=order_in.customer.full_name,
        phone=order_in.customer.phone,
        email=order_in.customer.email,
        address_line1=order_in.delivery_address.address_line1,
        address_line2=order_in.delivery_address.address_line2,
        city=order_in.delivery_address.city,
        district=order_in.delivery_address.district,
        postal_code=order_in.delivery_address.postal_code,
        country_code=order_in.delivery_address.country_code,
        delivery_type=order_in.delivery_type,
        payment_type=order_in.payment_type,
        order_note=order_in.order_note,
        do_not_ring_bell=order_in.do_not_ring_bell,
        client_ip=client_ip,
        turnstile_verified_at=turnstile_verified_at,
        items=order_items,
    )

    db.add(order)
    db.commit()

    return (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.selected_options))
        .filter(Order.id == order.id)
        .first()
    )
