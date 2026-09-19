from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "Personal OS"
    debug: bool = Field(default=False)
    secret_key: str = Field(default="dev-secret-change-in-prod", alias="JWT_SECRET")
    jwt_secret: str = Field(default="dev-secret-change-in-prod", alias="JWT_SECRET")
    jwt_alg: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # DB
    database_url: str = Field(default="postgresql+asyncpg://pos:pos@localhost:5432/pos", alias="DATABASE_URL")
    database_sync_url: str = Field(default="postgresql://pos:pos@localhost:5432/pos", alias="DATABASE_SYNC_URL")

    # RLS roles
    app_db_role: str = "app_user"
    app_db_password: str = "app_password"
    service_db_role: str = "service_user"
    service_db_password: str = "service_password"

    # CORS
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    # Tracing
    trace_file: str = Field(default="traces.jsonl", alias="TRACE_FILE")

    @property
    def async_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url

settings = Settings()
