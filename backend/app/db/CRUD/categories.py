from typing import Optional
from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def create_category(db: Session, category: CategoryCreate):
    db_category = Category(
        name=category.name,
        description=category.description,
        sort_order=category.sort_order,
        is_active=category.is_active,
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_categories(db: Session, *, active_only: bool = False):
    q = db.query(Category)
    if active_only:
        q = q.filter(Category.is_active == True)
    return q.order_by(Category.sort_order, Category.id).all()


def get_category(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()


def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Optional[Category]:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if cat is None:
        return None
    if data.name is not None:
        cat.name = data.name
    if data.description is not None:
        cat.description = data.description
    if data.sort_order is not None:
        cat.sort_order = data.sort_order
    if data.is_active is not None:
        cat.is_active = data.is_active
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, category_id: int) -> bool:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if cat is None:
        return False
    db.delete(cat)
    db.commit()
    return True