import json
import re

from services.segmentation_service import (
    get_audience_insights
)

from services.ai_service import (
    generate_content
)


def classify_and_respond(message: str) -> dict:
    """
    Single Gemini call that:
    1. Understands the user's natural language marketing goal
    2. Generates a unique, contextual AI reply
    3. Classifies intent and decides whether to offer data options

    Returns a dict with: intent, goal_label, reply, needs_data
    Returns None on failure (caller should use fallback).
    """

    prompt = f"""You are Xeno AI, a sharp and friendly AI marketing assistant inside XenoPulse CRM.

A user just sent this message: "{message}"

Your job:
1. Understand their marketing goal from the message — even if it's informal or vague
2. Write a warm, intelligent, 1–2 sentence reply that acknowledges their SPECIFIC words and goal
3. Classify their intent into one of these categories:
   - WINBACK: re-engage inactive, dormant, lost, or churned customers
   - RETENTION: increase repeat purchases, loyalty, reduce churn
   - UPSELL: increase order value, upgrade customers to premium
   - ENGAGEMENT: boost WhatsApp, Email, or SMS engagement
   - GENERAL: other valid marketing/CRM goal
   - UNRELATED: completely unrelated to marketing or CRM

Rules for the reply:
- Sound like a real marketing expert, not a bot
- Reference the user's actual words naturally
- Be concise — 1 to 2 sentences only
- For UNRELATED messages: politely say you're a marketing assistant and redirect
- For all marketing intents: end with a mention that you will analyze their customer data

Return ONLY a valid JSON object, no markdown, no explanation:
{{
  "intent": "WINBACK",
  "goal_label": "Bring back inactive customers",
  "reply": "Great goal — winning back dormant customers can unlock significant revenue. Let me dig into your customer data and find the right segment to target.",
  "needs_data": true
}}

For UNRELATED, set needs_data to false."""

    try:
        raw = generate_content(prompt)

        # Extract JSON even if Gemini adds extra text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            return None

        result = json.loads(match.group())

        # Validate required keys
        if not all(k in result for k in ("intent", "reply", "needs_data")):
            return None

        return result

    except Exception as e:
        print(f"[classify_and_respond] Gemini error: {e}")
        return None


def analyze_demo_data(goal):

    insights = get_audience_insights()

    return {

        "agent_state": "STRATEGY_READY",

        "thinking": {

            "customer_behavior":
                f"{insights['audience_size']} customers appear inactive",

            "engagement_pattern":
                f"{insights['preferred_channel']} is the dominant engagement channel",

            "value_assessment":
                f"Average customer spend is ₹{insights['avg_spend']}"
        },

        "decision": {

            "audience":
                f"{insights['audience_size']} inactive customers",

            "channel":
                insights["preferred_channel"],

            "campaign_type":
                "Win-Back Campaign"
        },

        "action_plan": {

            "objective":
                "Re-engage inactive customers",

            "expected_impact":
                "Medium-High",

            "next_step":
                "Choose campaign message source"
        },

        "actions": [

            "GENERATE_AI_CAMPAIGN",

            "UPLOAD_CUSTOM_MESSAGE"
        ]
    }


def generate_campaign_draft():

    prompt = """
You are an expert marketing strategist.

Create a win-back campaign.

Audience:
Inactive customers

Channel:
WhatsApp

Goal:
Re-engage inactive customers.

Return:

Campaign Name:
<name>

Message:
<message>
"""

    ai_response = generate_content(
        prompt
    )

    return {

        "agent_state":
            "CAMPAIGN_DRAFT_READY",

        "channel":
            "WhatsApp",

        "campaign_draft":
            ai_response,

        "requires_approval":
            True
    }