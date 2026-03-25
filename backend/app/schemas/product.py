from pydantic import BaseModel
from app.schemas.product_price import ProductPriceRead
from app.schemas.product_option import ProductOptionRead

class ProductBase(BaseModel):
    name: str
    description: str
    instock: bool
    imageurl: str
    category_id: int


class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    id:int

    class Config:
        from_attributes = True


class ProductReadWithPrices(ProductRead):
    prices: list[ProductPriceRead]
    options: list[ProductOptionRead] = []

    class Config:
        from_attributes = True