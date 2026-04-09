from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.discounts import (
    get_discounts,
    get_discount,
    create_discount,
    update_discount,
    delete_discount,
    get_active_discounts_map,
)
from app.schemas.discount import DiscountCreate, DiscountRead, DiscountUpdate
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=list[DiscountRead])
def list_discounts(db: Session = Depends(get_db)):
    discounts = get_discounts(db)
    result = []
    for d in discounts:
        item = DiscountRead(
            id=d.id,
            label=d.label,
            discount_type=d.discount_type,
            category_id=d.category_id,
            category_name=d.category.name if d.category else None,
            percentage=d.percentage,
            is_active=d.is_active,
            created_at=d.created_at,
        )
        result.append(item)
    return result


@router.post("/", response_model=DiscountRead)
def add_discount(
    data: DiscountCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    d = create_discount(db, data)
    return DiscountRead(
        id=d.id,
        label=d.label,
        discount_type=d.discount_type,
        category_id=d.category_id,
        category_name=d.category.name if d.category else None,
        percentage=d.percentage,
        is_active=d.is_active,
        created_at=d.created_at,
    )


@router.patch("/{discount_id}", response_model=DiscountRead)
def patch_discount(
    discount_id: int,
    data: DiscountUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    d = update_discount(db, discount_id, data)
    if d is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return DiscountRead(
        id=d.id,
        label=d.label,
        discount_type=d.discount_type,
        category_id=d.category_id,
        category_name=d.category.name if d.category else None,
        percentage=d.percentage,
        is_active=d.is_active,
        created_at=d.created_at,
    )


@router.delete("/{discount_id}")
def remove_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    ok = delete_discount(db, discount_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Discount not found")
    return {"detail": "Deleted"}


@router.get("/active-map")
def active_discounts_map(db: Session = Depends(get_db)):
    """Public endpoint: returns the currently active discount map for price calculation."""
    return get_active_discounts_map(db)

