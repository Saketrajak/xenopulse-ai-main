from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime

from database.database import Base
from datetime import datetime


class Campaign(Base):

    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True)

    name = Column(String)

    goal = Column(String)

    audience_size = Column(Integer)

    channel = Column(String)

    status = Column(String)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )