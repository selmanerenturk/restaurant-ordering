from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.products import create_product, get_all_products_with_prices, get_product_by_id_with_prices, get_products, update_product
from app.db.CRUD.products_with_default_prices import get_products_with_default_prices
from app.schemas.product import ProductCreate, ProductRead, ProductReadWithPrices, ProductUpdate
from app.schemas.product_with_default_price import ProductWithDefaultPriceBase
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return get_products(db)

#return all products with default price
@router.get("/with_default_prices", response_model=list[ProductWithDefaultPriceBase])
def list_products_with_default_prices(db: Session = Depends(get_db)):
    return get_products_with_default_prices(db)


@router.post("/", response_model=ProductRead)
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    return create_product(db, product)


@router.patch("/{product_id}", response_model=ProductRead)
def patch_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    product = update_product(db, product_id, product_update)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/with_prices", response_model=list[ProductReadWithPrices])
def list_products_with_prices(db: Session = Depends(get_db)):
    return get_all_products_with_prices(db)


@router.get(
    "/{product_id}/with_prices",
    response_model=ProductReadWithPrices,
    responses={404: {"description": "Product not found"}},
)
def get_product_with_prices(product_id: int, db: Session = Depends(get_db)):
    product = get_product_by_id_with_prices(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
