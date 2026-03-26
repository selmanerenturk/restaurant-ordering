from datetime import time
from typing import Optional
from sqlalchemy.orm import Session
from app.models.restaurant_settings import RestaurantSettings
from app.schemas.restaurant_settings import RestaurantSettingsUpdate

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def _parse_time(value: Optional[str]) -> Optional[time]:
    if not value:
        return None
    parts = value.split(":")
    return time(int(parts[0]), int(parts[1]))


def _format_time(value: Optional[time]) -> Optional[str]:
    if value is None:
        return None
    return value.strftime("%H:%M")


def get_settings(db: Session) -> RestaurantSettings:
    settings = db.query(RestaurantSettings).first()
    if settings is None:
        settings = RestaurantSettings(name="Restoran")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_settings_as_dict(db: Session) -> dict:
    s = get_settings(db)
    result = {
        "id": s.id,
        "name": s.name,
        "logo_url": s.logo_url,
        "phone": s.phone,
        "address": s.address,
        "is_temporarily_closed": s.is_temporarily_closed,
        "temporary_close_message": s.temporary_close_message,
    }
    for day in DAYS:
        result[day] = {
            "open": _format_time(getattr(s, f"{day}_open")),
            "close": _format_time(getattr(s, f"{day}_close")),
        }
    return result


def update_settings(db: Session, data: RestaurantSettingsUpdate) -> dict:
    s = get_settings(db)

    if data.name is not None:
        s.name = data.name
    if data.logo_url is not None:
        s.logo_url = data.logo_url
    if data.phone is not None:
        s.phone = data.phone
    if data.address is not None:
        s.address = data.address
    if data.is_temporarily_closed is not None:
        s.is_temporarily_closed = data.is_temporarily_closed
    if data.temporary_close_message is not None:
        s.temporary_close_message = data.temporary_close_message

    for day in DAYS:
        day_data = getattr(data, day)
        if day_data is not None:
            setattr(s, f"{day}_open", _parse_time(day_data.open))
            setattr(s, f"{day}_close", _parse_time(day_data.close))

    db.commit()
    db.refresh(s)
    return get_settings_as_dict(db)
