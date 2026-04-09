"""
Migration script: Add is_featured column to products table.
Run this once to add the column to an existing database.

Usage:
    cd backend
    python add_is_featured_column.py
"""
from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'is_featured'
        """))
        
        if result.fetchone():
            print("✓ Column 'is_featured' already exists in 'products' table.")
            return
        
        # Add the column
        conn.execute(text("""
            ALTER TABLE products 
            ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE
        """))
        conn.commit()
        print("✓ Column 'is_featured' added to 'products' table successfully.")

if __name__ == "__main__":
    migrate()

