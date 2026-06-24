from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
from app.models.product import Product
from app.models.product_price import ProductPrice
from app.models.product_option import ProductOption
from app.schemas.product import ProductCreate, ProductUpdate

def create_product(db: Session, product: ProductCreate):
    db_product = Product(name=product.name,
                         description=product.description,
                         instock=product.instock,
                         is_featured=product.is_featured,
                         imageurl=product.imageurl,
                         category_id=product.category_id )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products(db: Session):
    return db.query(Product).all()


def update_product(db: Session, product_id: int, product_update: ProductUpdate):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> str:
    """Delete a product and its prices/options.
    Returns: 'ok' | 'not_found' | 'in_use' (referenced by existing orders)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return "not_found"
    try:
        # prices have no cascade; remove them first (options cascade automatically)
        db.query(ProductPrice).filter(ProductPrice.product_id == product_id).delete(
            synchronize_session=False
        )
        db.delete(product)
        db.commit()
        return "ok"
    except IntegrityError:
        db.rollback()
        return "in_use"


def get_all_products_with_prices(db: Session):
    return (
        db.query(Product)
        .options(
            selectinload(Product.prices),
            selectinload(Product.options).selectinload(ProductOption.items),
        )
        .all()
    )

def get_product_by_id_with_prices(db: Session, product_id: int):
    return (
        db.query(Product)
        .options(
            selectinload(Product.prices),
            selectinload(Product.options).selectinload(ProductOption.items),
        )
        .filter(Product.id == product_id)
        .first()
    )
