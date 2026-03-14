from sqlalchemy.orm import Session
from app.models.product_price import ProductPrice
from app.schemas.product_price import ProductPriceCreate

def create_product_price(db: Session, product_price: ProductPriceCreate):
    db_product_price = ProductPrice(product_id=product_price.product_id,
                                    is_default=product_price.is_default,
                                    quantity_code=product_price.quantity_code,
                                    unit_code=product_price.unit_code,
                                    price=product_price.price,
                                    currency_code=product_price.currency_code)
    db.add(db_product_price)
    db.commit()
    db.refresh(db_product_price)
    return db_product_price

def get_product_prices(db: Session):
    return db.query(ProductPrice).all()