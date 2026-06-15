from fastapi import APIRouter
from pydantic import BaseModel

from database.database import SessionLocal
from models.communication_log import CommunicationLog

from datetime import datetime

router = APIRouter()


class ReceiptRequest(BaseModel):

    communication_id: int
    status: str
    retry_count: int = 0


@router.post("/communications/receipt")
def receive_receipt(
    request: ReceiptRequest
):

    db = SessionLocal()

    try:

        log = db.query(
            CommunicationLog
        ).filter(
            CommunicationLog.id ==
            request.communication_id
        ).first()

        if not log:

            return {
                "message": "Log not found"
            }

        # Update latest status
        log.status = request.status

        # Sync retry count from Channel Service
        log.retry_count = request.retry_count

        now = datetime.utcnow()

        # ----------------------------
        # Lifecycle State Machine
        # ----------------------------

        if request.status == "DELIVERED":

            if not log.delivered_at:
                log.delivered_at = now

        elif request.status == "OPENED":

            if not log.delivered_at:
                log.delivered_at = now

            if not log.opened_at:
                log.opened_at = now

        elif request.status == "CLICKED":

            if not log.delivered_at:
                log.delivered_at = now

            if not log.opened_at:
                log.opened_at = now

            if not log.clicked_at:
                log.clicked_at = now

        elif request.status == "CONVERTED":

            if not log.delivered_at:
                log.delivered_at = now

            if not log.opened_at:
                log.opened_at = now

            if not log.clicked_at:
                log.clicked_at = now

            if not log.converted_at:
                log.converted_at = now

        elif request.status == "FAILED":

            log.failure_reason = (
                "Temporary delivery failure"
            )

        elif request.status == "PERMANENT_FAILURE":

            log.retry_count = 3

            log.failure_reason = (
                "Maximum retry attempts exceeded"
            )

            print(
                f"PERMANENT_FAILURE received for {log.id}"
            )
            print(
                f"Failure reason set to: {log.failure_reason}"
            )



        db.commit()

        return {
            "message": "Receipt processed",
            "communication_id": log.id,
            "status": request.status,
            "retry_count": log.retry_count
        }

    finally:

        db.close()


@router.get("/communications/debug")
def debug():

    db = SessionLocal()

    try:

        logs = db.query(
            CommunicationLog
        ).order_by(
            CommunicationLog.id.desc()
        ).limit(50).all()

        return [
            {
                "id": log.id,
                "campaign_id": log.campaign_id,
                "customer_id": log.customer_id,
                "channel": log.channel,
                "status": log.status,
                "retry_count": log.retry_count,
                "failure_reason": log.failure_reason,
                "sent_at": str(log.sent_at),
                "delivered_at": str(log.delivered_at),
                "opened_at": str(log.opened_at),
                "clicked_at": str(log.clicked_at),
                "converted_at": str(log.converted_at)
            }
            for log in logs
        ]

    finally:

        db.close()