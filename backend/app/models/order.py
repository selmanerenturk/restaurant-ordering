from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, nullable=False, default="confirmed")
    currency_code = Column(String(3), nullable=False, default="TRY")

    subtotal = Column(Numeric(10, 2), nullable=False)
    delivery_fee = Column(Numeric(10, 2), nullable=False, default=0)
    total = Column(Numeric(10, 2), nullable=False)

    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)

    address_line1 = Column(String, nullable=False)
    address_line2 = Column(String)
    city = Column(String)
    district = Column(String)
    postal_code = Column(String)
    country_code = Column(String(2), nullable=False, default="TR")

    client_ip = Column(String)
    turnstile_verified_at = Column(DateTime(timezone=True))

    stage_id = Column(Integer, ForeignKey("order_stages.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    stage = relationship("OrderStage", back_populates="orders")
