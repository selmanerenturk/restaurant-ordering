from pydantic import BaseModel
from decimal import Decimal

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
    
    class Config:
        from_attributes = True