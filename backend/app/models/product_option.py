from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, true
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductOption(Base):
    __tablename__ = "product_options"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_required = Column(Boolean, default=False, nullable=False)
    allow_multiple = Column(Boolean, default=False, nullable=False)
    max_selections = Column(Integer, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="options")
    items = relationship("ProductOptionItem", back_populates="option", cascade="all, delete-orphan", order_by="ProductOptionItem.sort_order")


class ProductOptionItem(Base):
    __tablename__ = "product_option_items"

    id = Column(Integer, primary_key=True, index=True)
    option_id = Column(Integer, ForeignKey("product_options.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    extra_price = Column(Numeric(10, 2), nullable=False, default=0)
    currency_code = Column(String(3), nullable=False, default="TRY")
    is_default = Column(Boolean, default=False, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False, server_default=true())
    sort_order = Column(Integer, default=0, nullable=False)

    option = relationship("ProductOption", back_populates="items")
