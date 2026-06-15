from fastapi import APIRouter
from database.database import SessionLocal
from models.customer import Customer
from models.order import Order

router = APIRouter()

@router.get("/stats")
def stats():

    db = SessionLocal()

    return {
        "customers": db.query(Customer).count(),
        "orders": db.query(Order).count()
    }

@router.get("/debug/customers")
def debug_customers():

    db = SessionLocal()

    customers = db.query(Customer).limit(5).all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "last_purchase_date": str(c.last_purchase_date)
        }
        for c in customers
    ]

from models.communication_log import CommunicationLog


@router.get("/debug/logs")
def debug_logs():

    db = SessionLocal()

    return {
        "logs": db.query(
            CommunicationLog
        ).count()
    }