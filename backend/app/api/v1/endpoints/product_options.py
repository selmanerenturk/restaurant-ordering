from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.product_options import (
    get_options_by_product,
    get_option,
    create_option,
    update_option,
    delete_option,
    create_option_item,
    update_option_item,
    delete_option_item,
)
from app.schemas.product_option import (
    ProductOptionCreate,
    ProductOptionRead,
    ProductOptionUpdate,
    ProductOptionItemCreate,
    ProductOptionItemRead,
    ProductOptionItemUpdate,
)

router = APIRouter()


@router.get("/product/{product_id}", response_model=list[ProductOptionRead])
def list_product_options(product_id: int, db: Session = Depends(get_db)):
    return get_options_by_product(db, product_id)


@router.get("/{option_id}", response_model=ProductOptionRead)
def read_option(option_id: int, db: Session = Depends(get_db)):
    option = get_option(db, option_id)
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    return option


@router.post("/", response_model=ProductOptionRead)
def add_option(
    option_in: ProductOptionCreate,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    return create_option(db, option_in)


@router.patch("/{option_id}", response_model=ProductOptionRead)
def edit_option(
    option_id: int,
    option_in: ProductOptionUpdate,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    option = update_option(db, option_id, option_in)
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    return option


@router.delete("/{option_id}")
def remove_option(
    option_id: int,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    if not delete_option(db, option_id):
        raise HTTPException(status_code=404, detail="Option not found")
    return {"ok": True}


# --- Option Items ---

@router.post("/{option_id}/items", response_model=ProductOptionItemRead)
def add_option_item(
    option_id: int,
    item_in: ProductOptionItemCreate,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    item = create_option_item(db, option_id, item_in)
    if item is None:
        raise HTTPException(status_code=404, detail="Option not found")
    return item


@router.patch("/items/{item_id}", response_model=ProductOptionItemRead)
def edit_option_item(
    item_id: int,
    item_in: ProductOptionItemUpdate,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    item = update_option_item(db, item_id, item_in)
    if item is None:
        raise HTTPException(status_code=404, detail="Option item not found")
    return item


@router.delete("/items/{item_id}")
def remove_option_item(
    item_id: int,
    db: Session = Depends(get_db),
    _seller=Depends(get_current_seller),
):
    if not delete_option_item(db, item_id):
        raise HTTPException(status_code=404, detail="Option item not found")
    return {"ok": True}
