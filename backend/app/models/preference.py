import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Preferences(Base):
    __tablename__ = "preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    desired_role: Mapped[str | None] = mapped_column(String)
    desired_location: Mapped[str | None] = mapped_column(String)
    work_mode: Mapped[str | None] = mapped_column(String) # remote/onsite/hybrid
    experience_level: Mapped[str] = mapped_column(String, default="fresher")

    user = relationship("User", back_populates="preferences")
