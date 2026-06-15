from services.segmentation_service import (
    get_audience_insights
)

from services.ai_service import (
    generate_content
)


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