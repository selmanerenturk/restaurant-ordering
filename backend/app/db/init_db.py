from app.db.session import engine
from app.db.base import Base
from app.models import user, product, category, product_price, order, order_item, order_stage


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


if __name__ == "__main__":
    init_db()