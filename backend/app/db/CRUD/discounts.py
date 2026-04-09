from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.discount import Discount
from app.schemas.discount import DiscountCreate, DiscountUpdate


def get_discounts(db: Session, *, active_only: bool = False) -> List[Discount]:
    q = db.query(Discount)
    if active_only:
        q = q.filter(Discount.is_active == True)
    return q.order_by(Discount.id).all()


def get_discount(db: Session, discount_id: int) -> Optional[Discount]:
    return db.query(Discount).filter(Discount.id == discount_id).first()


def create_discount(db: Session, data: DiscountCreate) -> Discount:
    discount = Discount(
        label=data.label,
        discount_type=data.discount_type,
        category_id=data.category_id if data.discount_type == "category" else None,
        percentage=data.percentage,
        is_active=data.is_active,
    )
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount


def update_discount(db: Session, discount_id: int, data: DiscountUpdate) -> Optional[Discount]:
    discount = get_discount(db, discount_id)
    if not discount:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(discount, field, value)
    # If changed to global, clear category_id
    if discount.discount_type == "global":
        discount.category_id = None
    db.commit()
    db.refresh(discount)
    return discount


def delete_discount(db: Session, discount_id: int) -> bool:
    discount = get_discount(db, discount_id)
    if not discount:
        return False
    db.delete(discount)
    db.commit()
    return True


def get_active_discounts_map(db: Session) -> dict:
    """Return a dict for quick discount lookup.
    Returns:
        {
            "global": Decimal percentage or None,
            "category": { category_id: Decimal percentage, ... }
        }
    The highest applicable discount wins per category.
    """
    discounts = get_discounts(db, active_only=True)
    result = {"global": None, "category": {}}

    for d in discounts:
        if d.discount_type == "global":
            if result["global"] is None or d.percentage > result["global"]:
                result["global"] = d.percentage
        elif d.discount_type == "category" and d.category_id:
            existing = result["category"].get(d.category_id)
            if existing is None or d.percentage > existing:
                result["category"][d.category_id] = d.percentage

    return result

