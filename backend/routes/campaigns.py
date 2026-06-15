from fastapi import APIRouter
from pydantic import BaseModel

from database.database import SessionLocal
from models.communication_log import CommunicationLog
from models.customer import Customer
from services.ai_service import generate_campaign
from services.analytics_service import (
    get_campaign_analytics
)

router = APIRouter()

class CampaignRequest(BaseModel):
    goal: str

@router.post("/campaigns/plan")
def plan_campaign(request: CampaignRequest):

    result = generate_campaign(
        request.goal
    )

    return {
        "strategy": result
    }

@router.get(
    "/campaigns/{campaign_id}/analytics"
)
def campaign_analytics(
    campaign_id: int
):

    return get_campaign_analytics(
        campaign_id
    )

@router.get("/campaigns/{campaign_id}/progress")
def campaign_progress(campaign_id: int):
    db = SessionLocal()
    try:
        # Fetch logs joined with customer names to show details
        query_res = db.query(
            CommunicationLog.status,
            CommunicationLog.channel,
            Customer.name
        ).join(
            Customer, CommunicationLog.customer_id == Customer.id
        ).filter(
            CommunicationLog.campaign_id == campaign_id
        ).all()

        total = len(query_res)
        if total == 0:
            return {
                "campaign_id": campaign_id,
                "total": 0,
                "completed": 0,
                "failed": 0,
                "status": "NOT_FOUND",
                "logs": []
            }

        # Calculate states
        completed = sum(1 for log in query_res if log[0] not in ("PENDING", "INITIALIZING", "SENDING"))
        failed = sum(1 for log in query_res if log[0] == "FAILED")
        
        # Determine overall state
        if completed == total:
            status = "COMPLETED"
        elif completed > 0 or any(log[0] == "SENDING" for log in query_res):
            status = "SENDING"
        else:
            status = "INITIALIZING"

        # Fetch latest logs sorted chronologically to build scrolling logs terminal
        logs_detail = db.query(
            CommunicationLog.id,
            CommunicationLog.status,
            CommunicationLog.channel,
            Customer.name
        ).join(
            Customer, CommunicationLog.customer_id == Customer.id
        ).filter(
            CommunicationLog.campaign_id == campaign_id
        ).order_by(CommunicationLog.id.asc()).all()

        # Build output log strings
        log_statements = []
        for log in logs_detail:
            icon = "📡"
            if log[1] in ("SENT", "DELIVERED", "OPENED", "CLICKED", "CONVERTED"):
                icon = "✅"
                status_str = "SUCCESS"
            elif log[1] == "FAILED":
                icon = "❌"
                status_str = "FAILED"
            elif log[1] == "SENDING":
                icon = "⏳"
                status_str = "SENDING"
            else:
                icon = "💤"
                status_str = "QUEUED"
            
            log_statements.append({
                "id": log[0],
                "message": f"{icon} [{log[2]}] {status_str} for {log[3]}"
            })

        return {
            "campaign_id": campaign_id,
            "total": total,
            "completed": completed,
            "failed": failed,
            "status": status,
            "logs": log_statements
        }
    finally:
        db.close()