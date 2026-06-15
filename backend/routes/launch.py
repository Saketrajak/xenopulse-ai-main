from fastapi import APIRouter
from pydantic import BaseModel

from services.campaign_service import (
    launch_campaign
)

router = APIRouter()


class LaunchRequest(BaseModel):

    campaign_name: str

    goal: str

    channel: str

    audience_size: int


@router.post("/campaigns/launch")
def launch(request: LaunchRequest):

    return launch_campaign(
        request.campaign_name,
        request.goal,
        request.channel,
        request.audience_size
    )