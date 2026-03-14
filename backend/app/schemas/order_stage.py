from pydantic import BaseModel


class OrderStageBase(BaseModel):
    name: str
    description: str | None = None


class OrderStageCreate(OrderStageBase):
    pass


class OrderStageRead(OrderStageBase):
    id: int

    class Config:
        from_attributes = True
