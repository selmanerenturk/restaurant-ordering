from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.categories import create_category, get_categories, update_category, delete_category
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
def list_categories(
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    return get_categories(db, active_only=active_only)


@router.post("/", response_model=CategoryRead)
def add_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    return create_category(db, category)


@router.patch("/{category_id}", response_model=CategoryRead)
def patch_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    cat = update_category(db, category_id, data)
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.delete("/{category_id}")
def remove_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    ok = delete_category(db, category_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"detail": "Deleted"}