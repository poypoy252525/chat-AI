from abc import ABC, abstractmethod
from typing import Generator, List, Dict, Any

class BaseAIClient(ABC):
    """
    Abstract base class for AI clients.
    Ensures that any AI provider integrated implements a `generate_stream` method.
    """

    @abstractmethod
    def generate_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        settings: Dict[str, Any]
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generates a stream of responses from the AI.
        
        Args:
            system_prompt (str): The system prompt or instructions.
            messages (List[Dict[str, str]]): A list of dictionaries with 'role' and 'content' keys representing conversation history.
            settings (Dict[str, Any]): Additional settings for the model generation (e.g. temperature, model id).
            
        Yields:
            Dict[str, Any]: A chunk of the response containing the text and potentially metadata when finished.
            Format: {"text": "chunk of text", "metadata": {...}} 
            (metadata is usually None until the very end)
        """
    @abstractmethod
    def generate_content(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates a one-shot response from the AI.
        """
        pass
