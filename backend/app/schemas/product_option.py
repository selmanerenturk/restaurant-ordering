from decimal import Decimal
from pydantic import BaseModel


class ProductOptionItemCreate(BaseModel):
    name: str
    extra_price: Decimal = Decimal("0.00")
    currency_code: str = "TRY"
    is_default: bool = False
    is_available: bool = True
    sort_order: int = 0


class ProductOptionItemRead(BaseModel):
    id: int
    option_id: int
    name: str
    extra_price: Decimal
    currency_code: str
    is_default: bool
    is_available: bool
    sort_order: int

    class Config:
        from_attributes = True


class ProductOptionCreate(BaseModel):
    product_id: int
    name: str
    is_required: bool = False
    allow_multiple: bool = False
    max_selections: int | None = None
    sort_order: int = 0
    items: list[ProductOptionItemCreate] = []


class ProductOptionRead(BaseModel):
    id: int
    product_id: int
    name: str
    is_required: bool
    allow_multiple: bool
    max_selections: int | None = None
    sort_order: int
    items: list[ProductOptionItemRead] = []

    class Config:
        from_attributes = True


class ProductOptionUpdate(BaseModel):
    name: str | None = None
    is_required: bool | None = None
    allow_multiple: bool | None = None
    max_selections: int | None = None
    sort_order: int | None = None


class ProductOptionItemUpdate(BaseModel):
    name: str | None = None
    extra_price: Decimal | None = None
    currency_code: str | None = None
    is_default: bool | None = None
    is_available: bool | None = None
    sort_order: int | None = None
