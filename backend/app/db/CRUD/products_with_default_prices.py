from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.product_price import ProductPrice

def get_products_with_default_prices(db: Session):
    query = db.query(
        Product.id.label("product_id"),
        Product.imageurl.label("imageurl"),
        ProductPrice.id.label("default_price_id"),
        Product.name.label("product_name"),
        Product.instock.label("in_stock"),
        ProductPrice.quantity_code.label("default_quantity_code"),
        ProductPrice.unit_code.label("default_unit_code"),
        ProductPrice.price.label("default_price"),
        ProductPrice.currency_code.label("currency_code")
    ).join(
        ProductPrice, Product.id == ProductPrice.product_id
    ).filter(
        ProductPrice.is_default == True
    )

    results = query.all()
    return results