import json
from typing import Dict, Any, Generator
from rest_framework.exceptions import NotFound
from ..models import Conversation, Message
from ..ai.factory import get_ai_client

class MessageService:
    @staticmethod
    def handle_message_stream(
        conversation_id: str,
        user: Any,
        user_text: str,
        settings: Dict[str, Any]
    ) -> Generator[str, None, None]:
        """
        Handles saving the user message, fetching history, generating the response via SSE,
        and finally saving the assistant's response to the database.
        """
        # 1. Fetch conversation
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            raise NotFound(detail="Conversation not found.")

        # 2. Save user message
        user_message = Message.objects.create(
            conversation=conversation,
            role=Message.ROLE_USER,
            content=user_text
        )

        # 3. Retrieve conversation history
        # We order by created_at ascending to feed history logically.
        messages_queryset = conversation.messages.order_by('created_at')
        
        history = []
        for msg in messages_queryset:
            history.append({
                "role": msg.role,
                "content": msg.content
            })

        # 4. Get the AI Client
        provider = settings.get("provider", "gemini")
        ai_client = get_ai_client(provider)
        
        # System prompt - can be passed from settings or configured per conversation
        system_prompt = settings.get("system_prompt", "")

        # 5. Generator logic for SSE & DB Save
        def stream_generator():
            full_response = ""
            final_metadata = None
            error_occurred = False
            
            try:
                # Call the client
                response_stream = ai_client.generate_stream(
                    system_prompt=system_prompt,
                    messages=history,
                    settings=settings
                )
                
                for chunk in response_stream:
                    if chunk.get("error"):
                        error_occurred = True
                    
                    text = chunk.get("text", "")
                    if text:
                        full_response += text
                        # SSE requires data: prefix and double newline
                        sse_payload = json.dumps({"text": text})
                        yield f"data: {sse_payload}\n\n"
                        
                    metadata = chunk.get("metadata")
                    if metadata:
                        final_metadata = metadata
                
            except Exception as e:
                # Handle unexpected exceptions during generation
                error_occurred = True
                full_response += f"\n\n[Internal Stream Error: {str(e)}]"
                error_msg = json.dumps({"text": f"\n\n[Internal Stream Error: {str(e)}]"})
                yield f"data: {error_msg}\n\n"
                
            finally:
                # 6. Save Assistant response to the database after stream ends
                Message.objects.create(
                    conversation=conversation,
                    role=Message.ROLE_ASSISTANT,
                    content=full_response,
                    metadata=final_metadata
                )
                
                # Signal end of stream
                yield "data: [DONE]\n\n"

        return stream_generator()
