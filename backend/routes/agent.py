from fastapi import APIRouter
from pydantic import BaseModel

from services.agent_service import (
    analyze_demo_data,
    generate_campaign_draft,
    classify_and_respond,
)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/agent/chat")
def chat(request: ChatRequest):

    # Use Gemini to understand any natural language input
    result = classify_and_respond(request.message)

    # Graceful fallback if Gemini is unavailable
    if result is None:
        return {
            "goal": "UNKNOWN",
            "goal_label": request.message,
            "agent_state": "NEEDS_CLARIFICATION",
            "message": (
                "I had a little trouble understanding that. "
                "Could you describe your marketing goal in a bit more detail? "
                "For example: 'bring back inactive customers' or 'increase repeat purchases'."
            ),
            "actions": [],
        }

    intent     = result.get("intent", "GENERAL")
    goal_label = result.get("goal_label", request.message)
    reply      = result.get("reply", "Let me analyze your customer data.")
    needs_data = result.get("needs_data", True)

    # For unrelated messages — no action buttons, just the polite redirect
    if not needs_data or intent == "UNRELATED":
        return {
            "goal": "UNRELATED",
            "goal_label": goal_label,
            "agent_state": "NEEDS_CLARIFICATION",
            "message": reply,
            "actions": [],
        }

    # Marketing intent — offer data options
    return {
        "goal": intent,
        "goal_label": goal_label,
        "agent_state": "NEEDS_DATA",
        "message": reply,
        "actions": ["USE_DEMO_DATA", "UPLOAD_DATA"],
    }


class UseDemoRequest(BaseModel):
    goal: str = "RETENTION"
    preset: str = "saas"


@router.post("/agent/use-demo")
def use_demo(request: UseDemoRequest = UseDemoRequest()):
    return analyze_demo_data(goal=request.goal, preset=request.preset)


class GenerateCampaignRequest(BaseModel):
    goal: str = "WINBACK"
    channel: str = "WhatsApp"


@router.post("/agent/generate-campaign")
def generate_campaign(request: GenerateCampaignRequest = GenerateCampaignRequest()):
    return generate_campaign_draft(goal=request.goal, channel=request.channel)