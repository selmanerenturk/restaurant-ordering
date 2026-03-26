from pydantic import BaseModel
from typing import Optional


class CategoryBase(BaseModel):
    name: str
    description: str


class CategoryCreate(CategoryBase):
    sort_order: int = 0
    is_active: bool = True


class CategoryRead(CategoryBase):
    id: int
    sort_order: int = 0
    is_active: bool = True

    class Config:
        from_attributes = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None