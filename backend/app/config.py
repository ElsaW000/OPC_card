from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / '.env'


class Settings(BaseSettings):
    app_name: str = "壹席eSeat Backend"
    app_env: str = "development"
    app_port: int = 8001
    database_url: str = "postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    wechat_app_id: str = ""
    wechat_app_secret: str = ""
    jwt_secret: str = ""
    minimax_api_key: str = ""
    minimax_model: str = "abab6.5s-chat"

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
