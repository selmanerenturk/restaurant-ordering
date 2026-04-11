from pydantic import BaseModel
from typing import Optional


class WorkingHours(BaseModel):
    open: Optional[str] = None   # "HH:MM"
    close: Optional[str] = None  # "HH:MM"


class RestaurantSettingsRead(BaseModel):
    id: int
    name: str
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    monday: WorkingHours = WorkingHours()
    tuesday: WorkingHours = WorkingHours()
    wednesday: WorkingHours = WorkingHours()
    thursday: WorkingHours = WorkingHours()
    friday: WorkingHours = WorkingHours()
    saturday: WorkingHours = WorkingHours()
    sunday: WorkingHours = WorkingHours()

    is_temporarily_closed: bool = False
    temporary_close_message: Optional[str] = None

    class Config:
        from_attributes = True


class RestaurantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    monday: Optional[WorkingHours] = None
    tuesday: Optional[WorkingHours] = None
    wednesday: Optional[WorkingHours] = None
    thursday: Optional[WorkingHours] = None
    friday: Optional[WorkingHours] = None
    saturday: Optional[WorkingHours] = None
    sunday: Optional[WorkingHours] = None

    is_temporarily_closed: Optional[bool] = None
    temporary_close_message: Optional[str] = None


class RestaurantAvailability(BaseModel):
    is_open: bool
    reason: Optional[str] = None
    next_open_time: Optional[str] = None  # e.g. "Pazartesi 09:00"

