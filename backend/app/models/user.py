from sqlalchemy import Column, Integer, String
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    role = Column(String, nullable=False, default="customer")
    firm_name = Column(String, nullable=True)
    tax_number = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    post_code = Column(String, nullable=True)
