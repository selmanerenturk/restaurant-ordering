"""
Migration script: Add tracking_token column to orders table.
Run this once for existing databases.

Usage:
    cd backend
    py add_order_tracking_token_column.py
"""
from sqlalchemy import text

from app.db.session import engine


def migrate():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'tracking_token'
        """))

        if result.fetchone():
            print("OK Column 'tracking_token' already exists in 'orders' table.")
            return

        conn.execute(text("""
            ALTER TABLE orders
            ADD COLUMN tracking_token VARCHAR(128)
        """))
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_tracking_token
            ON orders (tracking_token)
        """))
        conn.commit()
        print("OK Column 'tracking_token' added to 'orders' table successfully.")


if __name__ == "__main__":
    migrate()

