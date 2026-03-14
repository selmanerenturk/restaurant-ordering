from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.categories import create_category, get_categories
from app.schemas.category import CategoryCreate, CategoryRead
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return get_categories(db)


@router.post("/", response_model=CategoryRead)
def add_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    return create_category(db, category)
