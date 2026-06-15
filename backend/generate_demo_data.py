from faker import Faker
import pandas as pd
import random
from datetime import datetime, timedelta
import os

fake = Faker()

customers = []
orders = []

NUM_CUSTOMERS = 500
NUM_ORDERS = 5000

categories = [
    "Coffee",
    "Fashion",
    "Beauty",
    "Electronics"
]

channels = [
    "WhatsApp",
    "Email",
    "SMS"
]

# Generate customers
for customer_id in range(1, NUM_CUSTOMERS + 1):

    total_spend = round(random.uniform(500, 25000), 2)

    customers.append({
        "customer_id": customer_id,
        "name": fake.name(),
        "email": fake.email(),
        "city": fake.city(),
        "preferred_channel": random.choice(channels),
        "total_spend": total_spend,
        "last_purchase_date": (
            datetime.now() -
            timedelta(days=random.randint(1, 180))
        ).date()
    })

# Generate orders
for order_id in range(1, NUM_ORDERS + 1):

    customer_id = random.randint(1, NUM_CUSTOMERS)

    orders.append({
        "order_id": order_id,
        "customer_id": customer_id,
        "amount": round(random.uniform(100, 5000), 2),
        "category": random.choice(categories),
        "order_date": (
            datetime.now() -
            timedelta(days=random.randint(1, 365))
        ).date()
    })

customers_df = pd.DataFrame(customers)
orders_df = pd.DataFrame(orders)

os.makedirs("data", exist_ok=True)

customers_df.to_csv(
    "data/customers.csv",
    index=False
)

orders_df.to_csv(
    "data/orders.csv",
    index=False
)

print("Demo data generated successfully!")