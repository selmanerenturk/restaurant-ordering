from . import user, product, category, product_price, order, order_item, order_stage

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
    "order",
    "order_item",
    "order_stage",
    "def_product",
]
