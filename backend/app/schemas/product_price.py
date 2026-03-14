from pydantic import BaseModel

class ProductPriceBase(BaseModel):
    product_id: int
    is_default: bool
    quantity_code: int
    unit_code: str
    price: int
    currency_code: str

class ProductPriceCreate(ProductPriceBase):
    pass

class ProductPriceRead(ProductPriceBase):
    id: int

    class Config:
        from_attributes = True