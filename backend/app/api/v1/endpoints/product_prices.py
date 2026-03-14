from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.product_prices import create_product_price, get_product_prices
from app.schemas.product_price import ProductPriceCreate, ProductPriceRead
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
