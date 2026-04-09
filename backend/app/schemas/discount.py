from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime


class DiscountCreate(BaseModel):
    label: str
    discount_type: str  # "global" or "category"
    category_id: Optional[int] = None
    percentage: Decimal
    is_active: bool = True

    @field_validator("discount_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("global", "category"):
            raise ValueError("discount_type must be 'global' or 'category'")
        return v

    @field_validator("percentage")
    @classmethod
    def validate_percentage(cls, v: Decimal) -> Decimal:
        if v <= 0 or v > 100:
            raise ValueError("percentage must be between 0 and 100")
        return v


class DiscountUpdate(BaseModel):
    label: Optional[str] = None
    percentage: Optional[Decimal] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None
    discount_type: Optional[str] = None

    @field_validator("discount_type")
    @classmethod
    def validate_type(cls, v):
        if v is not None and v not in ("global", "category"):
            raise ValueError("discount_type must be 'global' or 'category'")
        return v

    @field_validator("percentage")
    @classmethod
    def validate_percentage(cls, v):
        if v is not None and (v <= 0 or v > 100):
            raise ValueError("percentage must be between 0 and 100")
        return v


class DiscountRead(BaseModel):
    id: int
    label: str
    discount_type: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    percentage: Decimal
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

