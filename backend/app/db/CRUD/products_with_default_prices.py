from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.product_price import ProductPrice
from app.models.category import Category
from app.db.CRUD.discounts import get_active_discounts_map


def get_products_with_default_prices(db: Session):
    discount_map = get_active_discounts_map(db)

    query = db.query(
        Product.id.label("product_id"),
        Product.imageurl.label("imageurl"),
        ProductPrice.id.label("default_price_id"),
        Product.name.label("product_name"),
        Product.instock.label("in_stock"),
        Product.is_featured.label("is_featured"),
        ProductPrice.quantity_code.label("default_quantity_code"),
        ProductPrice.unit_code.label("default_unit_code"),
        ProductPrice.price.label("default_price"),
        ProductPrice.currency_code.label("currency_code"),
        Product.category_id.label("category_id"),
        Category.name.label("category_name"),
        Category.sort_order.label("category_sort_order"),
    ).join(
        ProductPrice, Product.id == ProductPrice.product_id
    ).join(
        Category, Product.category_id == Category.id
    ).filter(
        ProductPrice.is_default == True,
        Category.is_active == True,
    ).order_by(
        Category.sort_order, Product.name
    )

    rows = query.all()

    # Compute discounted prices in Python
    results = []
    for row in rows:
        item = dict(row._mapping)

        # Determine applicable discount: category-specific overrides global
        cat_id = item["category_id"]
        discount_pct = None
        if cat_id in (discount_map.get("category") or {}):
            discount_pct = discount_map["category"][cat_id]
        elif discount_map.get("global"):
            discount_pct = discount_map["global"]

        if discount_pct and discount_pct > 0:
            original = Decimal(str(item["default_price"]))
            discounted = (original * (100 - discount_pct) / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            item["discount_percentage"] = float(discount_pct)
            item["discounted_price"] = discounted
        else:
            item["discount_percentage"] = 0
            item["discounted_price"] = item["default_price"]

        results.append(item)

    return results