from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.db.CRUD.order_stages import create_order_stage, get_order_stages
from app.schemas.order_stage import OrderStageCreate, OrderStageRead

router = APIRouter()


@router.get("/", response_model=list[OrderStageRead])
def list_order_stages(db: Session = Depends(get_db)):
    return get_order_stages(db)


@router.post("/", response_model=OrderStageRead)
def add_order_stage(order_stage: OrderStageCreate, db: Session = Depends(get_db)):
    return create_order_stage(db, order_stage)
