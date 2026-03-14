from decimal import Decimal
from pydantic import BaseModel
from app.schemas.product import ProductRead
from app.schemas.product_price import ProductPriceRead


class ProductWithDefaultPrice(BaseModel):
    id: int
    name: str
    imageurl: str
    instock: bool
    default_price: Decimal
    currency_code: str
    quantity_code: int
    unit_code: str

    class Config:
        from_attributes = True


class ProductWithPrices(ProductRead):
    prices: list[ProductPriceRead]

    class Config:
        from_attributes = True
