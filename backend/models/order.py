from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from database.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    amount = Column(Float)
    category = Column(String)
    order_date = Column(Date)