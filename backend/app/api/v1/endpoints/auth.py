from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.db.CRUD.users import authenticate_user, create_seller, get_user_by_email
from app.core.security import create_access_token
from app.schemas.user import LoginRequest, TokenResponse, SellerRegisterRequest, UserRead

from app.core.turnstile import verify_turnstile

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    if login_data.turnstile_token:
        await verify_turnstile(login_data.turnstile_token)

    user = authenticate_user(db, login_data.email, login_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=access_token,
        user=UserRead.model_validate(user),
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_seller(data: SellerRegisterRequest, db: Session = Depends(get_db)):
    if data.turnstile_token:
        await verify_turnstile(data.turnstile_token)

    existing = get_user_by_email(db, data.email.lower().strip())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    user = create_seller(db, data)
    return UserRead.model_validate(user)
