import uuid
from datetime import datetime
from sqlalchemy import Text, Float, TIMESTAMP, ForeignKey, LargeBinary, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Resume(Base):
    __tablename__ = "resumes"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    file_name: Mapped[str | None] = mapped_column(String)
    file_path: Mapped[str | None] = mapped_column(String)
    raw_text: Mapped[str | None] = mapped_column(Text)
    parsed_json: Mapped[dict | None] = mapped_column(JSONB)
    ats_score: Mapped[float | None] = mapped_column(Float)
    ats_tips: Mapped[list | None] = mapped_column(JSONB)
    skills_keywords: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=datetime.utcnow)

    user = relationship("User", back_populates="resume")
