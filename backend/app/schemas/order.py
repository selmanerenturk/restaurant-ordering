from datetime import datetime
from decimal import Decimal
import re
from pydantic import BaseModel, field_validator


class OrderItemOptionCreate(BaseModel):
    option_item_id: int
    is_removed: bool = False


class OrderItemCreate(BaseModel):
    product_price_id: int
    quantity: int
    selected_options: list[OrderItemOptionCreate] = []

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 1:
            raise ValueError("quantity must be >= 1")
        return v


class OrderCustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        value = v.strip()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("invalid email")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        value = re.sub(r"\s+", "", v)
        if not re.fullmatch(r"\+?\d{10,15}", value):
            raise ValueError("invalid phone")
        return value


class OrderDeliveryAddressCreate(BaseModel):
    address_line1: str
    address_line2: str | None = None
    city: str | None = None
    district: str | None = None
    postal_code: str | None = None
    country_code: str = "TR"


class OrderCreate(BaseModel):
    customer: OrderCustomerCreate
    delivery_address: OrderDeliveryAddressCreate
    items: list[OrderItemCreate]
    delivery_type: str = "delivery"
    payment_type: str = "cash"
    order_note: str | None = None
    do_not_ring_bell: bool = False
    turnstile_token: str

    @field_validator("items")
    @classmethod
    def validate_items(cls, v: list[OrderItemCreate]) -> list[OrderItemCreate]:
        if len(v) == 0:
            raise ValueError("items must not be empty")
        return v

    @field_validator("delivery_type")
    @classmethod
    def validate_delivery_type(cls, v: str) -> str:
        valid = ["delivery", "pickup"]
        if v not in valid:
            raise ValueError(f"Invalid delivery_type. Must be one of: {valid}")
        return v

    @field_validator("payment_type")
    @classmethod
    def validate_payment_type(cls, v: str) -> str:
        valid = ["cash", "card"]
        if v not in valid:
            raise ValueError(f"Invalid payment_type. Must be one of: {valid}")
        return v


class OrderItemOptionRead(BaseModel):
    id: int
    option_name_snapshot: str
    item_name_snapshot: str
    extra_price_snapshot: Decimal
    currency_code_snapshot: str
    is_removed: bool = False

    class Config:
        from_attributes = True


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_price_id: int
    product_name_snapshot: str
    quantity_code_snapshot: int
    unit_code_snapshot: str
    unit_price_snapshot: Decimal
    currency_code_snapshot: str
    quantity: int
    line_total: Decimal
    selected_options: list[OrderItemOptionRead] = []

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: int
    status: str
    currency_code: str
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal

    full_name: str
    phone: str
    email: str

    address_line1: str
    address_line2: str | None = None
    city: str | None = None
    district: str | None = None
    postal_code: str | None = None
    country_code: str

    delivery_type: str
    payment_type: str
    order_note: str | None = None
    do_not_ring_bell: bool

    created_at: datetime

    items: list[OrderItemRead]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled", "returned"]
        if v not in valid:
            raise ValueError(f"Invalid status. Must be one of: {valid}")
        return v
