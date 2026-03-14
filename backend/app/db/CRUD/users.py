from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, SellerRegisterRequest
from app.core.security import hash_password, verify_password


def create_user(db: Session, user: UserCreate):
    db_user = User(
        email=user.email,
        name=user.name,
        password_hash=hash_password(user.password),
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_seller(db: Session, data: SellerRegisterRequest):
    db_user = User(
        email=data.email,
        name=data.name,
        surname=data.surname,
        password_hash=hash_password(data.password),
        role="seller",
        firm_name=data.firm_name,
        tax_number=data.tax_number,
        phone=data.phone,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        district=data.district,
        post_code=data.post_code,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session):
    return db.query(User).all()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email.lower().strip())
    if user is None:
        return None
    if user.password_hash is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
