from fastapi import APIRouter
from pydantic import BaseModel

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