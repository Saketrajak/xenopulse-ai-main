from database.database import SessionLocal
from models.customer import Customer
from models.order import Order

from datetime import datetime, timedelta
from collections import Counter


def get_inactive_customers(days=45):

    db = SessionLocal()

    try:

        threshold = datetime.now().date() - timedelta(days=days)

        customers = db.query(Customer).filter(
            Customer.last_purchase_date <= threshold
        ).all()

        return customers

    finally:
        db.close()


def get_audience_insights(days=45):

    db = SessionLocal()

    try:

        threshold = datetime.now().date() - timedelta(days=days)

        customers = db.query(Customer).filter(
            Customer.last_purchase_date <= threshold
        ).all()

        audience_size = len(customers)

        if audience_size == 0:
            return {
                "audience_size": 0
            }

        # Revenue Metrics
        avg_spend = sum(
            customer.total_spend
            for customer in customers
        ) / audience_size

        total_revenue = sum(
            customer.total_spend
            for customer in customers
        )

        # High Value Customers
        high_value_customers = len([
            customer
            for customer in customers
            if customer.total_spend > 15000
        ])

        # Preferred Channel
        channel_counter = Counter(
            customer.preferred_channel
            for customer in customers
        )

        preferred_channel = (
            channel_counter.most_common(1)[0][0]
        )

        # Top City
        city_counter = Counter(
            customer.city
            for customer in customers
        )

        top_city = (
            city_counter.most_common(1)[0][0]
        )

        # Top Category
        customer_ids = [
            customer.id
            for customer in customers
        ]

        orders = db.query(Order).filter(
            Order.customer_id.in_(customer_ids)
        ).all()

        category_counter = Counter(
            order.category
            for order in orders
        )

        top_category = (
            category_counter.most_common(1)[0][0]
            if category_counter
            else "Unknown"
        )

        # Average Order Value
        avg_order_value = (
            round(
                sum(order.amount for order in orders)
                / len(orders),
                2
            )
            if orders
            else 0
        )

        return {
            "audience_size": audience_size,
            "avg_spend": round(avg_spend, 2),
            "total_revenue": round(total_revenue, 2),
            "high_value_customers": high_value_customers,
            "preferred_channel": preferred_channel,
            "top_city": top_city,
            "top_category": top_category,
            "avg_order_value": avg_order_value
        }

    finally:
        db.close()