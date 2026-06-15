from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel

import random
import time
import requests

app = FastAPI(
    title="Xeno Channel Service"
)


class SendRequest(BaseModel):

    communication_id: int
    customer_id: int
    channel: str
    message: str


MAX_RETRIES = 3
DELIVERY_SUCCESS_RATE = 0.05


def send_callback(
    communication_id,
    status,
    retry_count
):

    try:

        requests.post(
            "http://127.0.0.1:8000/communications/receipt",
            json={
                "communication_id": communication_id,
                "status": status,
                "retry_count": retry_count
            },
            timeout=5
        )

    except Exception as e:

        print(
            f"Callback failed for {communication_id}:",
            e
        )


def simulate_lifecycle(data):

    communication_id = data["communication_id"]

    retry_count = 0

    delivered = False

    while retry_count < MAX_RETRIES:

        if random.random() < DELIVERY_SUCCESS_RATE:

            delivered = True

            break

        retry_count += 1

        print(
            f"Retry {retry_count} for Communication {communication_id}"
        )

        time.sleep(1)

    if not delivered:

        print(
            f"Communication {communication_id} -> PERMANENT_FAILURE"
        )

        send_callback(
            communication_id,
            "PERMANENT_FAILURE",
            retry_count
        )

        return

    print(
        f"Communication {communication_id} delivered after {retry_count} retries"
    )

    lifecycle_events = ["DELIVERED"]

    if random.random() < 0.70:

        lifecycle_events.append("OPENED")

        if random.random() < 0.30:

            lifecycle_events.append("CLICKED")

            if random.random() < 0.15:

                lifecycle_events.append("CONVERTED")

    for status in lifecycle_events:

        time.sleep(2)

        send_callback(
            communication_id,
            status,
            retry_count
        )

        print(
            f"Communication {communication_id} -> {status}"
        )


@app.post("/send")
def send_message(
    request: SendRequest,
    background_tasks: BackgroundTasks
):

    background_tasks.add_task(
        simulate_lifecycle,
        request.dict()
    )

    return {
        "accepted": True,
        "communication_id": request.communication_id
    }


@app.get("/")
def root():

    return {
        "message": "Channel Service Running"
    }