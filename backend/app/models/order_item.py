from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.db.base import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)

    # Nullable so a product/price can be deleted while order history is preserved
    # (the *_snapshot columns below keep the human-readable record).
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_price_id = Column(Integer, ForeignKey("product_prices.id"), nullable=True)

    product_name_snapshot = Column(String, nullable=False)
    quantity_code_snapshot = Column(Integer, nullable=False)
    unit_code_snapshot = Column(String, nullable=False)
    unit_price_snapshot = Column(Numeric(10, 2), nullable=False)
    currency_code_snapshot = Column(String(3), nullable=False)

    quantity = Column(Integer, nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    selected_options = relationship("OrderItemOption", back_populates="order_item", cascade="all, delete-orphan")
