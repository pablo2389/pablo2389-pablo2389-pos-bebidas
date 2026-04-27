import os
from dotenv import load_dotenv

# 🔥 cargar .env SIEMPRE desde este archivo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS = 7

settings = Settings()

# DEBUG (después lo podés borrar)
print("SUPABASE_URL:", settings.SUPABASE_URL)
print("SUPABASE_KEY:", settings.SUPABASE_KEY)