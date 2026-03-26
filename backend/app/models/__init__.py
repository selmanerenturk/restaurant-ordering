from . import user, product, category, product_price, order, order_item, order_stage, product_option, order_item_option, restaurant_settings

# Backwards compatibility for existing init_db import
# (def_product model is not defined as a table in this project)
try:
    from . import def_product  # type: ignore
except ImportError:  # pragma: no cover - optional module
    def_product = None

__all__ = [
    "user",
    "product",
    "category",
    "product_price",
    "product_option",
    "order",
    "order_item",
    "order_item_option",
    "order_stage",
    "restaurant_settings",
    "def_product",
]
