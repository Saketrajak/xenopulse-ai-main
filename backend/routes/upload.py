from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database.database import SessionLocal
from models.customer import Customer
from models.order import Order
import pandas as pd
import io

router = APIRouter()


@router.post("/upload/csv")
async def upload_csv(
    customers_file: UploadFile = File(...),
    orders_file: UploadFile = File(...)
):
    db: Session = SessionLocal()
    try:
        # 1. Read customers CSV
        customers_content = await customers_file.read()
        try:
            customers_df = pd.read_csv(io.BytesIO(customers_content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse customers.csv: {e}"
            )

        # Validate required columns for customers
        req_cust_cols = [
            "customer_id", "name", "email", "city",
            "preferred_channel", "total_spend", "last_purchase_date"
        ]
        missing_cust = [
            col for col in req_cust_cols
            if col not in customers_df.columns
        ]
        if missing_cust:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns in customers.csv: {missing_cust}"
            )

        # 2. Read orders CSV
        orders_content = await orders_file.read()
        try:
            orders_df = pd.read_csv(io.BytesIO(orders_content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse orders.csv: {e}"
            )

        # Validate required columns for orders
        req_order_cols = [
            "order_id", "customer_id", "amount",
            "category", "order_date"
        ]
        missing_order = [
            col for col in req_order_cols
            if col not in orders_df.columns
        ]
        if missing_order:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns in orders.csv: {missing_order}"
            )

        # Cap length to prevent performance overload and API timeout
        if len(customers_df) > 500:
            customers_df = customers_df.head(500)
        if len(orders_df) > 2000:
            orders_df = orders_df.head(2000)

        # Clear existing tables to ingest clean uploaded data
        db.query(Order).delete()
        db.query(Customer).delete()
        db.commit()

        # Insert customers
        for _, row in customers_df.iterrows():
            customer = Customer(
                id=int(row["customer_id"]),
                name=str(row["name"]),
                email=str(row["email"]),
                city=str(row["city"]),
                preferred_channel=str(row["preferred_channel"]),
                total_spend=float(row["total_spend"]),
                last_purchase_date=pd.to_datetime(
                    row["last_purchase_date"]
                ).date()
            )
            db.add(customer)
        db.commit()

        # Insert orders
        for _, row in orders_df.iterrows():
            order = Order(
                id=int(row["order_id"]),
                customer_id=int(row["customer_id"]),
                amount=float(row["amount"]),
                category=str(row["category"]),
                order_date=pd.to_datetime(
                    row["order_date"]
                ).date()
            )
            db.add(order)
        db.commit()

        return {
            "success": True,
            "customers_loaded": len(customers_df),
            "orders_loaded": len(orders_df)
        }

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {e}"
        )
    finally:
        db.close()
