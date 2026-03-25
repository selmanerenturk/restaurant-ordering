from sqlalchemy.orm import Session, selectinload
from app.models.product import Product
from app.models.product_option import ProductOption
from app.schemas.product import ProductCreate

def create_product(db: Session, product: ProductCreate):
    db_product = Product(name=product.name,
                         description=product.description,
                         instock=product.instock,
                         imageurl=product.imageurl,
                         category_id=product.category_id )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products(db: Session):
    return db.query(Product).all()


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
