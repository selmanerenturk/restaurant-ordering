from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Known insecure placeholder that must never be used as a real signing key.
_INSECURE_JWT_PLACEHOLDER = "change-me-to-a-random-secret-key-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "FastAPI Template"

    POSTGRES_USER: str = "postgres_"
    POSTGRES_PASSWORD: str = "postgres_"
    POSTGRES_DB: str = "appdb_"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Required: no default. The app refuses to start without a real key.
    # Generate one with:  openssl rand -hex 32
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def _reject_insecure_jwt_key(cls, v: str) -> str:
        if not v or v.strip() == _INSECURE_JWT_PLACEHOLDER:
            raise ValueError(
                "JWT_SECRET_KEY is missing or set to the insecure placeholder. "
                "Set a strong random value (e.g. `openssl rand -hex 32`) via the "
                "environment / Render env panel."
            )
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY is too short; use at least 32 characters.")
        return v

    TURNSTILE_SECRET_KEY: str | None = None

    # Supabase Storage for product images (persistent object storage).
    # When unset, uploads fall back to local disk (dev only — ephemeral on Render).
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_KEY: str | None = None
    SUPABASE_STORAGE_BUCKET: str = "products"

    SHOP_OWNER_EMAIL: str | None = None
    SHOP_OWNER_PHONE: str | None = None

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None

    # Twilio Configuration for SMS, WhatsApp, and Voice Notifications
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_PHONE_NUMBER: str | None = None
    TWILIO_WHATSAPP_NUMBER: str | None = None
    TWILIO_STATUS_CALLBACK_URL: str | None = None
    TWILIO_VALIDATE_WEBHOOK_SIGNATURE: bool = False

    # Notification Settings
    ENABLE_SMS_NOTIFICATIONS: bool = False
    ENABLE_WHATSAPP_NOTIFICATIONS: bool = False
    ENABLE_CUSTOMER_WHATSAPP_NOTIFICATIONS: bool = False
    ENABLE_VOICE_NOTIFICATIONS: bool = False
    ENABLE_EMAIL_NOTIFICATIONS: bool = True
    NOTIFICATION_RETRY_ATTEMPTS: int = 3
    NOTIFICATION_RETRY_DELAY_SECONDS: int = 5

    CUSTOMER_APP_BASE_URL: str = "http://localhost:5173"

    # Restaurant timezone (IANA format)
    RESTAURANT_TIMEZONE: str = "Europe/Istanbul"

    # Database SSL (set to True in production/Render, False for local dev)
    DB_SSL_REQUIRE: bool = True

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()