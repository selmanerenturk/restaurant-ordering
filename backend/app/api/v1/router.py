from fastapi import APIRouter
from app.api.v1.endpoints import products, categories, product_prices, product_options, orders, order_stages, auth, restaurant_settings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(product_prices.router, prefix="/product_prices", tags=["product_prices"])
api_router.include_router(product_options.router, prefix="/product_options", tags=["product_options"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(order_stages.router, prefix="/order_stages", tags=["order_stages"])
api_router.include_router(restaurant_settings.router, prefix="/restaurant_settings", tags=["restaurant_settings"])
