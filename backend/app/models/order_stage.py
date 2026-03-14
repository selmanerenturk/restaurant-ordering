from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class OrderStage(Base):
    __tablename__ = "order_stages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String)

    orders = relationship("Order", back_populates="stage")
