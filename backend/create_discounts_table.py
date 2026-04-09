"""
Migration script: Create discounts table.
Run this once to add the table to an existing database.

Usage:
    cd backend
    py create_discounts_table.py
"""
from app.db.session import engine
from sqlalchemy import text


def migrate():
    with engine.connect() as conn:
        # Check if table already exists
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'discounts'
        """))

        if result.fetchone():
            print("✓ Table 'discounts' already exists.")
            return

        conn.execute(text("""
            CREATE TABLE discounts (
                id SERIAL PRIMARY KEY,
                label VARCHAR(200) NOT NULL,
                discount_type VARCHAR(20) NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                percentage NUMERIC(5, 2) NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        conn.commit()
        print("✓ Table 'discounts' created successfully.")


if __name__ == "__main__":
    migrate()

