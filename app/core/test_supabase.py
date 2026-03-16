from sqlalchemy import text
from app.core.session import engine

def test_supabase_connection():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1


# run pytest app/core/test_supabase.py