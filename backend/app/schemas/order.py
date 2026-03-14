from datetime import datetime
from decimal import Decimal
import re
from pydantic import BaseModel, field_validator


class OrderItemCreate(BaseModel):
    product_price_id: int
    quantity: int

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
    turnstile_token: str

    @field_validator("items")
    @classmethod
    def validate_items(cls, v: list[OrderItemCreate]) -> list[OrderItemCreate]:
        if len(v) == 0:
            raise ValueError("items must not be empty")
        return v


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

    created_at: datetime

    items: list[OrderItemRead]

    class Config:
        from_attributes = True
