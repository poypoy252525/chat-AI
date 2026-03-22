from typing import Optional
from ..ai.factory import get_ai_client

class SummaryService:
    @staticmethod
    def generate_title(message_content: str) -> str:
        """
        Uses AI to analyze the message content and generate a concise title.
        """
        ai_client = get_ai_client("gemini")
        system_prompt = (
            "You are a helpful assistant that generates short, catchy, and accurate titles for chat conversations. "
            "Based on the user's first message, provide a title that is maximum 4-5 words. "
            "Respond ONLY with the title text. Do not use quotes or punctuation like periods at the end."
        )
        
        try:
            response = ai_client.generate_content(
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": message_content}],
                settings={"model": "gemma-3-27b-it"}
            )
            title = response.get("text", "").strip()
            # Fallback if AI fails or returns weird content
            if not title or len(title) > 50:
                words = message_content.split()
                return " ".join(words[:5]) + ("..." if len(words) > 5 else "")
            return title
        except Exception:
            # Simple fallback
            words = message_content.split()
            return " ".join(words[:5]) + ("..." if len(words) > 5 else "")

    @staticmethod
    def generate_summary(message_content: str) -> str:
        """
        Generates a brief summary of the initial conversation topic.
        """
        # For simplicity, we can just use a similar approach or a shorter version of the message
        # Given the request focused on the title, we'll keep summary simple for now
        return message_content[:150] + ("..." if len(message_content) > 150 else "")
