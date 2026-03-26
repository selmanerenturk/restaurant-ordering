from sqlalchemy import Column, Integer, String, Boolean, Time, Text
from app.db.base import Base


class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, default="Restoran")
    logo_url = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)

    # Working hours (per day of week, stored as JSON-like columns for simplicity)
    monday_open = Column(Time, nullable=True)
    monday_close = Column(Time, nullable=True)
    tuesday_open = Column(Time, nullable=True)
    tuesday_close = Column(Time, nullable=True)
    wednesday_open = Column(Time, nullable=True)
    wednesday_close = Column(Time, nullable=True)
    thursday_open = Column(Time, nullable=True)
    thursday_close = Column(Time, nullable=True)
    friday_open = Column(Time, nullable=True)
    friday_close = Column(Time, nullable=True)
    saturday_open = Column(Time, nullable=True)
    saturday_close = Column(Time, nullable=True)
    sunday_open = Column(Time, nullable=True)
    sunday_close = Column(Time, nullable=True)

    # Temporary closure
    is_temporarily_closed = Column(Boolean, default=False, nullable=False)
    temporary_close_message = Column(Text, nullable=True)
