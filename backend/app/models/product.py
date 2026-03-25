from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base



class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(String)
    instock = Column(Boolean, default=True, nullable=False)
    imageurl = Column(String, nullable=False)
    category_id = Column(Integer,  ForeignKey('categories.id'), nullable=False)

    category = relationship("Category", back_populates="products")
    prices = relationship("ProductPrice", back_populates="product")
    options = relationship("ProductOption", back_populates="product", cascade="all, delete-orphan", order_by="ProductOption.sort_order")