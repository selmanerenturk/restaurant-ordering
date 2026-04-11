from datetime import time, datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from app.models.restaurant_settings import RestaurantSettings
from app.schemas.restaurant_settings import RestaurantSettingsUpdate
from app.core.config import settings as app_settings

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
DAY_LABELS_TR = {
    "monday": "Pazartesi",
    "tuesday": "Salı",
    "wednesday": "Çarşamba",
    "thursday": "Perşembe",
    "friday": "Cuma",
    "saturday": "Cumartesi",
    "sunday": "Pazar",
}


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


def _find_next_open_time(settings_obj: RestaurantSettings, now: datetime) -> Optional[str]:
    """Scan forward up to 7 days to find the next opening time."""
    for offset in range(0, 8):
        check_date = now + timedelta(days=offset)
        day_name = DAYS[check_date.weekday()]
        day_open = getattr(settings_obj, f"{day_name}_open")
        day_close = getattr(settings_obj, f"{day_name}_close")

        if day_open is None or day_close is None:
            continue

        # For today, only consider if open time is still in the future
        if offset == 0:
            if now.time() < day_open:
                return f"{DAY_LABELS_TR[day_name]} {day_open.strftime('%H:%M')}"
            else:
                continue
        else:
            return f"{DAY_LABELS_TR[day_name]} {day_open.strftime('%H:%M')}"

    return None


def check_restaurant_availability(db: Session) -> dict:
    """
    Check if the restaurant is currently open for orders.
    Returns: { is_open: bool, reason: str|None, next_open_time: str|None }
    """
    s = get_settings(db)

    # 1) Check temporary closure first
    if s.is_temporarily_closed:
        reason = s.temporary_close_message or "Restoran geçici olarak kapalıdır."
        tz = ZoneInfo(app_settings.RESTAURANT_TIMEZONE)
        now = datetime.now(tz)
        next_open = _find_next_open_time(s, now)
        return {
            "is_open": False,
            "reason": reason,
            "next_open_time": next_open,
        }

    # 2) Check working hours
    tz = ZoneInfo(app_settings.RESTAURANT_TIMEZONE)
    now = datetime.now(tz)
    day_name = DAYS[now.weekday()]
    day_open = getattr(s, f"{day_name}_open")
    day_close = getattr(s, f"{day_name}_close")

    # If no hours set for today → closed today
    if day_open is None or day_close is None:
        next_open = _find_next_open_time(s, now)
        reason = "Restoran bugün kapalıdır."
        if next_open:
            reason += f" En yakın açılış: {next_open}"
        return {
            "is_open": False,
            "reason": reason,
            "next_open_time": next_open,
        }

    current_time = now.time()

    # Handle overnight hours (e.g. 20:00 - 02:00)
    if day_close <= day_open:
        is_within = current_time >= day_open or current_time < day_close
    else:
        is_within = day_open <= current_time < day_close

    if not is_within:
        next_open = _find_next_open_time(s, now)
        day_label = DAY_LABELS_TR[day_name]
        reason = f"Restoran şu anda kapalıdır. Çalışma saatleri: {day_label} {day_open.strftime('%H:%M')} - {day_close.strftime('%H:%M')}"
        if next_open:
            reason = f"Restoran şu anda kapalıdır. En yakın açılış: {next_open}"
        return {
            "is_open": False,
            "reason": reason,
            "next_open_time": next_open,
        }

    return {
        "is_open": True,
        "reason": None,
        "next_open_time": None,
    }

