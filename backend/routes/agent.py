from fastapi import APIRouter
from pydantic import BaseModel

from services.agent_service import (
    analyze_demo_data,
    generate_campaign_draft
)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/agent/chat")
def chat(request: ChatRequest):

    message = request.message.lower()

    if "repeat purchase" in message:

        return {
            "goal": "RETENTION",
            "agent_state": "NEEDS_DATA",
            "message":
                "I can help investigate repeat purchases. Would you like to upload customer data or use demo data?",
            "actions": [
                "UPLOAD_DATA",
                "USE_DEMO_DATA"
            ]
        }

    elif "inactive" in message:

        return {
            "goal": "WINBACK",
            "agent_state": "NEEDS_DATA",
            "message":
                "I found a win-back use case. Would you like to upload customer data or use demo data?",
            "actions": [
                "UPLOAD_DATA",
                "USE_DEMO_DATA"
            ]
        }

    return {
        "goal": "UNKNOWN",
        "agent_state": "NEEDS_CLARIFICATION",
        "message":
            "Can you tell me more about the business problem?"
    }


@router.post("/agent/use-demo")
def use_demo():

    return analyze_demo_data(
        goal="RETENTION"
    )


@router.post("/agent/generate-campaign")
def generate_campaign():

    return generate_campaign_draft()