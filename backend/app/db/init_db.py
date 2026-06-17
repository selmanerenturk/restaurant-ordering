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

        # Add tracking_token to orders if missing, backfill existing rows, then enforce uniqueness
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token VARCHAR"))
            conn.execute(text(
                "UPDATE orders SET tracking_token = replace(gen_random_uuid()::text, '-', '') "
                "WHERE tracking_token IS NULL"
            ))
            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_orders_tracking_token "
                "ON orders (tracking_token)"
            ))
            conn.commit()
            print("Ensured 'tracking_token' column exists on orders.")
        except Exception as e:
            print(f"Note: could not add tracking_token column: {e}")
            conn.rollback()


if __name__ == "__main__":
    init_db()