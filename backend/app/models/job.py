import uuid
from datetime import datetime
from sqlalchemy import String, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class CachedJob(Base):
    __tablename__ = "cached_jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    query_hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    results_json: Mapped[dict | None] = mapped_column(JSONB)
    fetched_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=datetime.utcnow)
