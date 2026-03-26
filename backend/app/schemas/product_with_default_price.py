from pydantic import BaseModel
from decimal import Decimal
from typing import Optional


class ProductWithDefaultPriceBase(BaseModel):
    product_id: int
    imageurl: str
    default_price_id: int
    product_name: str
    in_stock: bool
    default_quantity_code: int
    default_unit_code: str
    default_price: Decimal
    currency_code: str
    category_id: int = 0
    category_name: str = ""
    category_sort_order: int = 0

    class Config:
        from_attributes = True