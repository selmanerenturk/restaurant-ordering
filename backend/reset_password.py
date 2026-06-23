"""
Reset an existing user's password (manual password reset, per MVP spec).

Usage:
    cd backend
    python reset_password.py --email someone@example.com
    # new password is prompted securely (or pass --password for non-interactive use)
"""
import argparse
import getpass
import sys

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.db.CRUD.users import get_user_by_email


def main():
    parser = argparse.ArgumentParser(description="Reset a user's password.")
    parser.add_argument("--email", required=True, help="Email of the existing user")
    parser.add_argument("--password", help="New password (min 6 chars). If omitted, you are prompted.")
    args = parser.parse_args()

    email = args.email.strip().lower()

    password = args.password
    if not password:
        password = getpass.getpass("New password (min 6 chars): ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Error: passwords do not match.")
            sys.exit(1)

    if len(password) < 6:
        print("Error: password must be at least 6 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = get_user_by_email(db, email)
        if user is None:
            print(f"Error: no user found with email '{email}'.")
            sys.exit(1)

        user.password_hash = hash_password(password)
        db.commit()
        print(f"✓ Password reset for {user.email} (id={user.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
