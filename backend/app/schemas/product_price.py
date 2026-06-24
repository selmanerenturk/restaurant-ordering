from pydantic import BaseModel
from typing import Optional

class ProductPriceBase(BaseModel):
    product_id: int
    is_default: bool
    quantity_code: int
    unit_code: str
    price: float
    currency_code: str

class ProductPriceCreate(ProductPriceBase):
    pass

class ProductPriceUpdate(BaseModel):
    is_default: Optional[bool] = None
    quantity_code: Optional[int] = None
    unit_code: Optional[str] = None
    price: Optional[float] = None
    currency_code: Optional[str] = None

class ProductPriceRead(ProductPriceBase):
    id: int

    class Config:
        from_attributes = True