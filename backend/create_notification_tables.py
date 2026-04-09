#!/usr/bin/env python
"""Create notification system database tables."""

from app.db.base import Base
from app.db.session import engine
from app import models
import sqlalchemy as sa

# Create all tables
Base.metadata.create_all(bind=engine)
print("✓ All tables created successfully")

# Verify notification tables exist
inspector = sa.inspect(engine)
all_tables = inspector.get_table_names()
notification_tables = [t for t in all_tables if 'notification' in t]

print(f"\n✓ Notification tables created:")
for table in notification_tables:
    print(f"  - {table}")

# Show column structure
if 'notification_preferences' in all_tables:
    columns = inspector.get_columns('notification_preferences')
    print(f"\n✓ notification_preferences columns:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")

if 'notifications' in all_tables:
    columns = inspector.get_columns('notifications')
    print(f"\n✓ notifications table columns (first 5):")
    for col in columns[:5]:
        print(f"  - {col['name']}: {col['type']}")

print("\n✓ Database setup complete! You can now create orders.")

