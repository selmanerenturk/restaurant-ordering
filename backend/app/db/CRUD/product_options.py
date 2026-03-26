from __future__ import annotations

from typing import Optional
from sqlalchemy.orm import Session, selectinload
from app.models.product_option import ProductOption, ProductOptionItem
from app.schemas.product_option import (
    ProductOptionCreate,
    ProductOptionUpdate,
    ProductOptionItemCreate,
    ProductOptionItemUpdate,
)


def get_options_by_product(db: Session, product_id: int) -> list[ProductOption]:
    return (
        db.query(ProductOption)
        .options(selectinload(ProductOption.items))
        .filter(ProductOption.product_id == product_id)
        .order_by(ProductOption.sort_order)
        .all()
    )


def get_option(db: Session, option_id: int) -> Optional[ProductOption]:
    return (
        db.query(ProductOption)
        .options(selectinload(ProductOption.items))
        .filter(ProductOption.id == option_id)
        .first()
    )


def create_option(db: Session, option_in: ProductOptionCreate) -> ProductOption:
    option = ProductOption(
        product_id=option_in.product_id,
        name=option_in.name,
        is_required=option_in.is_required,
        allow_multiple=option_in.allow_multiple,
        max_selections=option_in.max_selections,
        sort_order=option_in.sort_order,
    )
    db.add(option)
    db.flush()

    for item_in in option_in.items:
        item = ProductOptionItem(
            option_id=option.id,
            name=item_in.name,
            extra_price=item_in.extra_price,
            currency_code=item_in.currency_code,
            is_default=item_in.is_default,
            sort_order=item_in.sort_order,
        )
        db.add(item)

    db.commit()
    db.refresh(option)
    return get_option(db, option.id)


def update_option(db: Session, option_id: int, option_in: ProductOptionUpdate) -> Optional[ProductOption]:
    option = db.query(ProductOption).filter(ProductOption.id == option_id).first()
    if option is None:
        return None
    for field, value in option_in.model_dump(exclude_unset=True).items():
        setattr(option, field, value)
    db.commit()
    return get_option(db, option_id)


def delete_option(db: Session, option_id: int) -> bool:
    option = db.query(ProductOption).filter(ProductOption.id == option_id).first()
    if option is None:
        return False
    db.delete(option)
    db.commit()
    return True


# --- Option Items ---

def get_option_item(db: Session, item_id: int) -> Optional[ProductOptionItem]:
    return db.query(ProductOptionItem).filter(ProductOptionItem.id == item_id).first()


def create_option_item(db: Session, option_id: int, item_in: ProductOptionItemCreate) -> Optional[ProductOptionItem]:
    option = db.query(ProductOption).filter(ProductOption.id == option_id).first()
    if option is None:
        return None
    item = ProductOptionItem(
        option_id=option_id,
        name=item_in.name,
        extra_price=item_in.extra_price,
        currency_code=item_in.currency_code,
        is_default=item_in.is_default,
        sort_order=item_in.sort_order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_option_item(db: Session, item_id: int, item_in: ProductOptionItemUpdate) -> Optional[ProductOptionItem]:
    item = db.query(ProductOptionItem).filter(ProductOptionItem.id == item_id).first()
    if item is None:
        return None
    for field, value in item_in.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_option_item(db: Session, item_id: int) -> bool:
    item = db.query(ProductOptionItem).filter(ProductOptionItem.id == item_id).first()
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True
