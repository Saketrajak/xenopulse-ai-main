import json
import re
import random
from datetime import datetime, timedelta

from database.database import SessionLocal
from models.customer import Customer
from models.order import Order

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


def get_campaign_type(goal: str) -> str:
    goal_upper = str(goal).upper()
    if "WINBACK" in goal_upper:
        return "Win-Back Campaign"
    elif "RETENTION" in goal_upper:
        return "Retention Campaign"
    elif "UPSELL" in goal_upper:
        return "Upsell Campaign"
    elif "ENGAGEMENT" in goal_upper:
        return "Engagement Campaign"
    else:
        return "Marketing Campaign"


def generate_preset_data(db, preset: str):
    db.query(Order).delete()
    db.query(Customer).delete()
    db.commit()

    preset = str(preset).lower()

    if "coffee" in preset:
        cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai"]
        channels = ["WhatsApp", "WhatsApp", "WhatsApp", "Email", "SMS"]
        categories = ["Coffee", "Bakery", "Beverages"]
        customer_count = 500
        order_count = 1500
        min_spend, max_spend = 100.0, 1500.0
        min_order, max_order = 50.0, 300.0
    elif "fashion" in preset:
        cities = ["Jaipur", "Ahmedabad", "Surat", "Indore", "Delhi"]
        channels = ["SMS", "SMS", "SMS", "WhatsApp", "Email"]
        categories = ["Apparel", "Footwear", "Accessories"]
        customer_count = 500
        order_count = 1200
        min_spend, max_spend = 1500.0, 8000.0
        min_order, max_order = 500.0, 2500.0
    else:
        cities = ["Bangalore", "Hyderabad", "Noida", "Gurugram", "Pune"]
        channels = ["Email", "Email", "Email", "WhatsApp", "SMS"]
        categories = ["SaaS Subscription", "API Credits", "Premium Support"]
        customer_count = 500
        order_count = 1000
        min_spend, max_spend = 10000.0, 25000.0
        min_order, max_order = 2000.0, 10000.0

    names = [
        "Aarav Sharma", "Vivaan Patel", "Aditya Verma", "Vihaan Gupta", "Arjun Reddy",
        "Sai Kiran", "Reyansh Kapoor", "Krishna Murthy", "Ishaan Roy", "Shaurya Joshi",
        "Diya Sen", "Ananya Mishra", "Aadhya Nair", "Pari Choudhury", "Pihu Das",
        "Ira Banerjee", "Saisha Kulkarni", "Prisha Bhat", "Aanya Saxena", "Navya Rao"
    ]
    
    for i in range(1, customer_count + 1):
        name = random.choice(names) + f" #{i}"
        email = f"user_{i}@{preset if 'coffee' in preset or 'fashion' in preset or 'saas' in preset else 'saas'}-shop.com"
        city = random.choice(cities)
        pref_channel = random.choice(channels)
        total_spend = round(random.uniform(min_spend, max_spend), 2)
        last_purchase = datetime.now().date() - timedelta(days=random.randint(1, 180))

        customer = Customer(
            id=i,
            name=name,
            email=email,
            city=city,
            preferred_channel=pref_channel,
            total_spend=total_spend,
            last_purchase_date=last_purchase
        )
        db.add(customer)

    for o in range(1, order_count + 1):
        cust_id = random.randint(1, customer_count)
        amount = round(random.uniform(min_order, max_order), 2)
        cat = random.choice(categories)
        order_date = datetime.now().date() - timedelta(days=random.randint(1, 365))

        order = Order(
            id=o,
            customer_id=cust_id,
            amount=amount,
            category=cat,
            order_date=order_date
        )
        db.add(order)

    db.commit()


def analyze_demo_data(goal="RETENTION", preset="saas"):
    db = SessionLocal()
    try:
        if preset != "uploaded":
            generate_preset_data(db, preset)
        insights = get_audience_insights()
        campaign_name_type = get_campaign_type(goal)

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
                    campaign_name_type
            },
            "action_plan": {
                "objective":
                    f"Run a {campaign_name_type} targeting inactive customers",
                "expected_impact":
                    "Medium-High",
                "next_step":
                    "Choose campaign channel and message source"
            },
            "actions": [
                "GENERATE_AI_CAMPAIGN",
                "UPLOAD_CUSTOM_MESSAGE"
            ]
        }
    finally:
        db.close()


def generate_campaign_draft(goal="WINBACK", channel="WhatsApp"):
    campaign_name_type = get_campaign_type(goal)

    prompt = f"""
You are an expert marketing strategist inside XenoPulse AI marketing copilot.

Create a campaign draft for:
Campaign Type: {campaign_name_type}
Goal/Intent: {goal}
Target Audience: Inactive customer segment
Channel: {channel}

Formatting Guidelines for the chosen Channel ({channel}):
- If channel is WhatsApp: Write a highly engaging message using emojis, keep it relatively short (under 4-5 sentences), and sound friendly.
- If channel is Email: Provide a clear, catchy subject line (Subject: <subject>) followed by the email body. Keep it professional yet persuasive.
- If channel is SMS: Write an extremely concise, punchy text message under 160 characters. Do not include subject lines or HTML, just pure SMS copy.
- If channel is RCS: Write a highly engaging rich text message (under 3-4 sentences) using emojis, and explicitly include 2 suggested action replies/chips (e.g. Reply: "View Deals", Reply: "Opt Out") at the bottom of the message.

Please return your response with:
Campaign Name: <A punchy name for this campaign>
Message: <The generated message template>
"""

    ai_response = generate_content(
        prompt
    )

    return {

        "agent_state":
            "CAMPAIGN_DRAFT_READY",

        "channel":
            channel,

        "campaign_draft":
            ai_response,

        "requires_approval":
            True
    }