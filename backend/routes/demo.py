from fastapi import APIRouter
from sqlalchemy.orm import Session
from database.database import SessionLocal
from models.customer import Customer
from models.order import Order

import pandas as pd

router = APIRouter()


@router.post("/demo/load")
def load_demo_data():

    db: Session = SessionLocal()

    try:

        # Prevent duplicate loading
        customer_count = db.query(Customer).count()

        if customer_count > 0:
            return {
                "message": "Demo data already loaded"
            }

        # Load Customers
        customers_df = pd.read_csv("data/customers.csv")

        for _, row in customers_df.iterrows():

            customer = Customer(
                id=int(row["customer_id"]),
                name=row["name"],
                email=row["email"],
                city=row["city"],
                preferred_channel=row["preferred_channel"],
                total_spend=float(row["total_spend"]),
                last_purchase_date=pd.to_datetime(
                    row["last_purchase_date"]
                ).date()
            )

            db.add(customer)

        db.commit()

        # Load Orders
        orders_df = pd.read_csv("data/orders.csv")

        for _, row in orders_df.iterrows():

            order = Order(
                id=int(row["order_id"]),
                customer_id=int(row["customer_id"]),
                amount=float(row["amount"]),
                category=row["category"],
                order_date=pd.to_datetime(
                    row["order_date"]
                ).date()
            )

            db.add(order)

        db.commit()

        return {
            "message": "Demo data loaded successfully",
            "customers_loaded": len(customers_df),
            "orders_loaded": len(orders_df)
        }

    except Exception as e:

        db.rollback()

        return {
            "error": str(e)
        }

    finally:

        db.close()