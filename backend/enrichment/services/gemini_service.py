import google.generativeai as genai
import os


def get_model(model_name: str = "gemini-pro"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    return genai.GenerativeModel(model_name)
