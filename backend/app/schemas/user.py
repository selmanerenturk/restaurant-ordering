from pydantic import BaseModel, EmailStr, field_validator
import re


class UserBase(BaseModel):
    email: str
    name: str


class UserCreate(UserBase):
    password: str
    role: str = "customer"


class SellerRegisterRequest(BaseModel):
    name: str
    surname: str
    firm_name: str
    tax_number: str
    phone: str
    email: str
    password: str
    address_line1: str
    address_line2: str = ""
    city: str
    district: str
    post_code: str
    turnstile_token: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v):
            raise ValueError("Please write a valid email")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not cleaned.replace("+", "").isdigit() or len(cleaned) < 10:
            raise ValueError("Please write a valid phone number")
        return v

    @field_validator("tax_number")
    @classmethod
    def validate_tax_number(cls, v):
        if not v.strip().isdigit() or len(v.strip()) < 10:
            raise ValueError("Tax number must be at least 10 digits")
        return v.strip()


class UserRead(BaseModel):
    id: int
    email: str
    name: str | None = None
    surname: str | None = None
    role: str
    firm_name: str | None = None
    tax_number: str | None = None
    phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    district: str | None = None
    post_code: str | None = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str
    turnstile_token: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v):
            raise ValueError("Please write a valid email")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
