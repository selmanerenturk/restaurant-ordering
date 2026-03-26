from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.restaurant_settings import get_settings_as_dict, update_settings
from app.schemas.restaurant_settings import RestaurantSettingsUpdate
from app.models.user import User

router = APIRouter()


@router.get("/")
def read_settings(db: Session = Depends(get_db)):
    return get_settings_as_dict(db)


@router.patch("/")
def patch_settings(
    data: RestaurantSettingsUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    return update_settings(db, data)
