import google.generativeai as genai
import os

from dotenv import load_dotenv
from google.api_core.exceptions import GoogleAPIError

load_dotenv()

# Parse all keys from GEMINI_API_KEYS or GEMINI_API_KEY (comma-separated support)
api_keys = [k.strip() for k in os.getenv("GEMINI_API_KEYS", "").split(",") if k.strip()]
if not api_keys and os.getenv("GEMINI_API_KEY"):
    api_keys = [k.strip() for k in os.getenv("GEMINI_API_KEY", "").split(",") if k.strip()]

current_key_index = 0
model = None

def configure_next_key():
    global current_key_index, model
    if not api_keys:
        print("[ai_service] WARNING: No Gemini API keys found in env.")
        return False
    
    key = api_keys[current_key_index]
    print(f"[ai_service] Configuring key index {current_key_index} (starts with {key[:8]}...)")
    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    current_key_index = (current_key_index + 1) % len(api_keys)
    return True

# Initialize first key
configure_next_key()


def generate_content(prompt):
    max_attempts = len(api_keys) if api_keys else 1
    
    for attempt in range(max_attempts):
        try:
            if model is None:
                raise Exception("GenerativeModel is not configured.")
            
            response = model.generate_content(prompt)
            return response.text
        except GoogleAPIError as e:
            if attempt < max_attempts - 1:
                print(f"[ai_service] Attempt {attempt + 1} failed. Error: {e}. Rotating key...")
                configure_next_key()
            else:
                print(f"[ai_service] All attempts failed. Error: {e}")
                raise e
        except Exception as e:
            if attempt < max_attempts - 1:
                print(f"[ai_service] Generic error on attempt {attempt + 1}: {e}. Rotating key...")
                configure_next_key()
            else:
                raise e

    raise Exception("All Gemini API keys are exhausted.")


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