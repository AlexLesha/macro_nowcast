from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings
import os

from .stock_cache_manager import (
    StockFundamentalsCacheManager,
    CACHE_TTL_DAYS,
    CACHE_TTL_SECONDS,
)

# Connect args needed for SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that yields a database session and handles teardown."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all database tables registered with Base."""
    try:
        import app.models.db_models  # Ensure models are imported
    except ImportError:
        import backend.app.models.db_models
    Base.metadata.create_all(bind=engine)
    try:
        from app.models.gics_seed import seed_gics_industries
    except ImportError:
        from backend.app.models.gics_seed import seed_gics_industries
    with SessionLocal() as db:
        seed_gics_industries(db)

