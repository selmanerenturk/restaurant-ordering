from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.product_price import ProductPrice
from app.schemas.product_price import ProductPriceCreate, ProductPriceUpdate

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


def update_product_price(db: Session, price_id: int, data: ProductPriceUpdate):
    pp = db.query(ProductPrice).filter(ProductPrice.id == price_id).first()
    if pp is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pp, field, value)
    db.commit()
    db.refresh(pp)
    return pp


def delete_product_price(db: Session, price_id: int) -> str:
    """Returns: 'ok' | 'not_found' | 'in_use' (referenced by existing orders)."""
    pp = db.query(ProductPrice).filter(ProductPrice.id == price_id).first()
    if pp is None:
        return "not_found"
    try:
        db.delete(pp)
        db.commit()
        return "ok"
    except IntegrityError:
        db.rollback()
        return "in_use"