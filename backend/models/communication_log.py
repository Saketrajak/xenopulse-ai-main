from sqlalchemy import Column, Integer, String, DateTime
from database.database import Base
from datetime import datetime


class CommunicationLog(Base):

    __tablename__ = "communication_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    campaign_id = Column(Integer)

    customer_id = Column(Integer)

    channel = Column(String)

    status = Column(String)

    retry_count = Column(
        Integer,
        default=0
    )

    failure_reason = Column(
        String,
        nullable=True
    )

    sent_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    delivered_at = Column(
        DateTime,
        nullable=True
    )

    opened_at = Column(
        DateTime,
        nullable=True
    )

    clicked_at = Column(
        DateTime,
        nullable=True
    )

    converted_at = Column(
        DateTime,
        nullable=True
    )