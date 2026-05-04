from app.db.session import engine
from app.db.base import Base
from app.models import user, product, category, product_price, product_option, order, order_item, order_item_option, order_stage, restaurant_settings, notification, discount
from sqlalchemy import text


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

    # Safely add columns that may be missing from older deployments
    with engine.connect() as conn:
        # Add is_featured to products if missing
        try:
            conn.execute(text(
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE"
            ))
            conn.commit()
            print("Ensured 'is_featured' column exists on products.")
        except Exception as e:
            print(f"Note: could not add is_featured column (may already exist or DB doesn't support IF NOT EXISTS): {e}")
            conn.rollback()


if __name__ == "__main__":
    init_db()