from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    quantity_code = Column(Integer, nullable=False)
    unit_code = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), nullable=False)

    product = relationship("Product", back_populates="prices")
