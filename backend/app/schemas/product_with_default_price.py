from pydantic import BaseModel
from decimal import Decimal


class ProductWithDefaultPriceBase(BaseModel):
    product_id: int
    imageurl: str
    default_price_id: int
    product_name: str
    in_stock: bool
    is_featured: bool = False
    default_quantity_code: int
    default_unit_code: str
    default_price: Decimal
    discount_percentage: float = 0
    discounted_price: Decimal = Decimal("0")
    currency_code: str
    category_id: int = 0
    category_name: str = ""
    category_sort_order: int = 0

    class Config:
        from_attributes = True