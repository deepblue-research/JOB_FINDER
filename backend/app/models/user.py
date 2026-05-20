import uuid
from datetime import datetime
from sqlalchemy import String, Integer, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    college: Mapped[str | None] = mapped_column(String)
    batch_year: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=datetime.utcnow)

    preferences = relationship("Preferences", back_populates="user", uselist=False)
    resume = relationship("Resume", back_populates="user", uselist=False)
    skill_gap_caches = relationship("SkillGapCache", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
