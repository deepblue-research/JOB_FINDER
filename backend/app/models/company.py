from sqlalchemy import String, Column
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
import uuid

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    ats_type: Mapped[str] = mapped_column(String, nullable=False) # greenhouse, lever, ashby
    ats_slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)
