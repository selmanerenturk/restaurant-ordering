from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(200), nullable=False)                # e.g. "Bayram İndirimi", "Tatlılarda %15"
    discount_type = Column(String(20), nullable=False)         # "global" or "category"
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)  # NULL for global
    percentage = Column(Numeric(5, 2), nullable=False)         # e.g. 10.00 for 10%
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    category = relationship("Category")

