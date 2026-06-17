from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.core.limiter import limiter
from app.db.CRUD.users import authenticate_user, create_seller, get_user_by_email
from app.core.security import create_access_token
from app.schemas.user import LoginRequest, TokenResponse, SellerRegisterRequest, UserRead
from app.models.user import User

from app.core.turnstile import verify_turnstile

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    # Fail-closed: missing/invalid token is rejected inside verify_turnstile.
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
async def register_seller(
    data: SellerRegisterRequest,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    # Only an already-authenticated seller may create new seller accounts.
    # The very first account must be created out-of-band via backend/create_seller.py
    existing = get_user_by_email(db, data.email.lower().strip())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    user = create_seller(db, data)
    return UserRead.model_validate(user)
