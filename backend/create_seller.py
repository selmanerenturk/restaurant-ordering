"""
Bootstrap script: create the initial seller (admin) account.

Since POST /api/v1/auth/register is now locked behind seller authentication,
the very first seller account must be created out-of-band with this script.
After this account exists, you can log in and create additional sellers
through the API/UI.

Usage:
    cd backend
    python create_seller.py --email owner@example.com --name "Shop Owner"
    # password is prompted securely (or pass --password for non-interactive use)

Run with --help to see all options.
"""
import argparse
import getpass
import sys

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.db.CRUD.users import get_user_by_email
from app.models.user import User


def main():
    parser = argparse.ArgumentParser(description="Create the initial seller account.")
    parser.add_argument("--email", required=True, help="Login email")
    parser.add_argument("--name", required=True, help="Owner name")
    parser.add_argument("--password", help="Password (min 6 chars). If omitted, you are prompted.")
    parser.add_argument("--surname", default="", help="Owner surname")
    parser.add_argument("--firm-name", default="", help="Firm / restaurant name")
    parser.add_argument("--tax-number", default="", help="Tax number")
    parser.add_argument("--phone", default="", help="Phone number")
    args = parser.parse_args()

    email = args.email.strip().lower()

    password = args.password
    if not password:
        password = getpass.getpass("Password (min 6 chars): ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Error: passwords do not match.")
            sys.exit(1)

    if len(password) < 6:
        print("Error: password must be at least 6 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        if get_user_by_email(db, email):
            print(f"Error: a user with email '{email}' already exists.")
            sys.exit(1)

        user = User(
            email=email,
            name=args.name,
            surname=args.surname,
            password_hash=hash_password(password),
            role="seller",
            firm_name=args.firm_name,
            tax_number=args.tax_number,
            phone=args.phone,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✓ Seller account created: id={user.id}, email={user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
