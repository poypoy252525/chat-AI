from .base import BaseAIClient
from .gemini import GeminiClient

class AIFactory:
    """
    Factory to retrieve the appropriate AI client instance based on configuration or environment.
    """
    
    @staticmethod
    def get_ai_client(provider: str = "gemini") -> BaseAIClient:
        if provider.lower() == "gemini":
            return GeminiClient()
        # Add future providers like openai, anthropic here
        else:
            raise ValueError(f"Unknown AI provider: {provider}")

def get_ai_client(provider: str = "gemini") -> BaseAIClient:
    return AIFactory.get_ai_client(provider)
