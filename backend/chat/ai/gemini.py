import os
import base64
from typing import Generator, List, Dict, Any
from .base import BaseAIClient
from google import genai
from google.genai import types

class GeminiClient(BaseAIClient):
    """
    Implementation of the BaseAIClient for Google's Gemini models using the google-genai SDK.
    """

    def __init__(self):
        # The client will automatically pick up GEMINI_API_KEY from environment variables
        self.client = genai.Client()

    def generate_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        settings: Dict[str, Any]
    ) -> Generator[Dict[str, Any], None, None]:
        
        # Default model from environment or fallback
        model = settings.get("model") or os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash-exp")
        
        # Prepare system instruction
        config_params = {}
        if system_prompt:
            config_params["system_instruction"] = system_prompt
            
        if "temperature" in settings:
            config_params["temperature"] = settings["temperature"]
            
        config = types.GenerateContentConfig(**config_params)

        # Convert simple {'role': '...', 'content': '...'} messages to Gemini types
        gemini_contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            parts = []
            
            # Add text part if content exists
            if msg.get("content"):
                parts.append(types.Part.from_text(text=msg["content"]))
            
            # Add image parts if they exist
            if "images" in msg and msg["images"]:
                for img in msg["images"]:
                    try:
                        image_data = base64.b64decode(img["data"])
                        parts.append(types.Part.from_bytes(
                            data=image_data,
                            mime_type=img["type"]
                        ))
                    except Exception as e:
                        print(f"Error decoding image: {e}")
            
            if parts:
                gemini_contents.append(types.Content(role=role, parts=parts))

        try:
            response_stream = self.client.models.generate_content_stream(
                model=model,
                contents=gemini_contents,
                config=config,
            )
            
            # We want to yield back plain text chunks to be SSE serialized
            # Plus extract usage metadata from the final chunks if possible
            for chunk in response_stream:
                if chunk.text:
                    yield {"text": chunk.text, "metadata": None}
                
                # Check for metadata/finish reason in the chunk
                # In standard usage, the last chunk contains usage metadata
                if chunk.usage_metadata:
                    yield {
                        "text": "", 
                        "metadata": {
                            "model": model,
                            "prompt_token_count": chunk.usage_metadata.prompt_token_count,
                            "candidates_token_count": chunk.usage_metadata.candidates_token_count,
                            "total_token_count": chunk.usage_metadata.total_token_count
                        }
                    }
        except Exception as e:
            # Handle API errors gracefully or yield an error chunk if appropriate
            yield {"text": f"\n\n[Error from Gemini API: {str(e)}]", "error": True, "metadata": None}

    def generate_content(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates a one-shot response from the AI.
        """
        model = settings.get("model") or os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash-exp")

        config_params = {}
        if system_prompt:
            config_params["system_instruction"] = system_prompt
        
        config = types.GenerateContentConfig(**config_params)

        gemini_contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            parts = []
            
            # Add text part if content exists
            if msg.get("content"):
                parts.append(types.Part.from_text(text=msg["content"]))
            
            # Add image parts if they exist
            if "images" in msg and msg["images"]:
                for img in msg["images"]:
                    try:
                        image_data = base64.b64decode(img["data"])
                        parts.append(types.Part.from_bytes(
                            data=image_data,
                            mime_type=img["type"]
                        ))
                    except Exception as e:
                        print(f"Error decoding image: {e}")
            
            if parts:
                gemini_contents.append(types.Content(role=role, parts=parts))

        try:
            response = self.client.models.generate_content(
                model=model,
                contents=gemini_contents,
                config=config,
            )
            return {"text": response.text, "metadata": None}
        except Exception as e:
            return {"text": f"[Error: {str(e)}]", "error": True, "metadata": None}
