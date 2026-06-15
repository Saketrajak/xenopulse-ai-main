from sqlalchemy import Column, Integer, String, Float, Date
from database.database import Base

class Customer(Base):

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    email = Column(String)

    city = Column(String)

    preferred_channel = Column(String)

    total_spend = Column(Float)

    last_purchase_date = Column(Date)