from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # recommended for Postgres
    connect_args={"sslmode": "require"} if settings.DB_SSL_REQUIRE else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)