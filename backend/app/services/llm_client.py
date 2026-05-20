import anthropic
from app.config import settings

class LLMClient:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-sonnet-20240229"

    async def get_completion(self, system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> str:
        """Sends a prompt to Claude and returns the response text."""
        if not settings.ANTHROPIC_API_KEY:
            return "Error: Anthropic API Key not configured."

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            return message.content[0].text
        except Exception as e:
            print(f"LLM Error: {e}")
            return f"Error communicating with LLM: {str(e)}"

# Singleton instance
llm_client = LLMClient()
