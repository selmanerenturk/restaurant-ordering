from sqlalchemy.orm import Session
from app.models.order_stage import OrderStage
from app.schemas.order_stage import OrderStageCreate


def create_order_stage(db: Session, order_stage: OrderStageCreate):
    db_order_stage = OrderStage(name=order_stage.name, description=order_stage.description)
    db.add(db_order_stage)
    db.commit()
    db.refresh(db_order_stage)
    return db_order_stage


def get_order_stages(db: Session):
    return db.query(OrderStage).all()
