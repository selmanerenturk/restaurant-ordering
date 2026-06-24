from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.product_prices import (
    create_product_price,
    get_product_prices,
    update_product_price,
    delete_product_price,
)
from app.schemas.product_price import ProductPriceCreate, ProductPriceRead, ProductPriceUpdate
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=list[ProductPriceRead])
def list_product_prices(db: Session = Depends(get_db)):
    return get_product_prices(db)


@router.post("/", response_model=ProductPriceRead)
def add_product_price(
    product_price: ProductPriceCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    return create_product_price(db, product_price)


@router.patch("/{price_id}", response_model=ProductPriceRead)
def patch_product_price(
    price_id: int,
    data: ProductPriceUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    pp = update_product_price(db, price_id, data)
    if pp is None:
        raise HTTPException(status_code=404, detail="Price not found")
    return pp


@router.delete("/{price_id}")
def remove_product_price(
    price_id: int,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    result = delete_product_price(db, price_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Price not found")
    if result == "in_use":
        raise HTTPException(
            status_code=409,
            detail="Bu fiyat mevcut siparişlerde kullanıldığı için silinemez.",
        )
    return {"detail": "Deleted"}
