from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.db.base import Base


class OrderItemOption(Base):
    __tablename__ = "order_item_options"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False, index=True)

    option_name_snapshot = Column(String, nullable=False)
    item_name_snapshot = Column(String, nullable=False)
    extra_price_snapshot = Column(Numeric(10, 2), nullable=False, default=0)
    currency_code_snapshot = Column(String(3), nullable=False, default="TRY")
    is_removed = Column(Boolean, default=False, nullable=False)

    order_item = relationship("OrderItem", back_populates="selected_options")
