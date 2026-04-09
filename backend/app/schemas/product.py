from pydantic import BaseModel
from typing import Optional
from app.schemas.product_price import ProductPriceRead
from app.schemas.product_option import ProductOptionRead

class ProductBase(BaseModel):
    name: str
    description: str
    instock: bool
    imageurl: str
    category_id: int


class ProductCreate(ProductBase):
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instock: Optional[bool] = None
    is_featured: Optional[bool] = None
    imageurl: Optional[str] = None
    category_id: Optional[int] = None


class ProductRead(ProductBase):
    id: int
    is_featured: bool = False

    class Config:
        from_attributes = True


class ProductReadWithPrices(ProductRead):
    prices: list[ProductPriceRead]
    options: list[ProductOptionRead] = []

    class Config:
        from_attributes = True