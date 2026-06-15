import google.generativeai as genai
import os

from dotenv import load_dotenv

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


def generate_content(prompt):

    response = model.generate_content(
        prompt
    )

    return response.text


def generate_campaign(goal):

    prompt = f"""
    You are a CRM strategist.

    Business Goal:
    {goal}

    Return JSON only.

    {{
      "audience_reason":"",
      "recommended_channel":"",
      "predicted_open_rate":"",
      "predicted_conversion_rate":"",
      "message":""
    }}
    """

    return generate_content(
        prompt
    )