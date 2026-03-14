from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session, selectinload
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product_price import ProductPrice
from app.models.product import Product
from app.schemas.order import OrderCreate


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

    for item in order_in.items:
        p = prices_by_id[item.product_price_id]
        unit_price = Decimal(p.price)
        qty = Decimal(item.quantity)
        line_total = (unit_price * qty).quantize(Decimal("0.01"))
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
        client_ip=client_ip,
        turnstile_verified_at=turnstile_verified_at,
        items=order_items,
    )

    db.add(order)
    db.commit()

    return (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order.id)
        .first()
    )
