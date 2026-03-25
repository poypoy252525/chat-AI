import json
import base64
from typing import Dict, Any, Generator, List
from django.core.files.base import ContentFile
from rest_framework.exceptions import NotFound
from ..models import Conversation, Message, MessageAttachment
from ..ai.factory import get_ai_client

class MessageService:
    @staticmethod
    def handle_message_stream(
        conversation_id: str,
        user: Any,
        user_text: str,
        images: List[Dict[str, Any]],
        settings: Dict[str, Any]
    ) -> Generator[str, None, None]:
        """
        Handles saving the user message, saving attachments to media storage,
        fetching history, and generating the response via SSE.
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

        # 3. Save attachments to media storage
        if images:
            for img in images:
                try:
                    # Decode base64
                    format, imgstr = img["data"].split(';base64,') if ';base64,' in img["data"] else (None, img["data"])
                    ext = img["type"].split('/')[-1]
                    data = ContentFile(base64.b64decode(imgstr), name=f"upload.{ext}")
                    
                    MessageAttachment.objects.create(
                        message=user_message,
                        file=data,
                        file_type=img["type"]
                    )
                except Exception as e:
                    print(f"Error saving attachment: {e}")

        # 4. Retrieve conversation history
        # We merge consecutive messages with the same role (e.g., User Image then User Text)
        # to obey alternating roles (User, Model, User, Model) for Gemini API.
        messages_queryset = conversation.messages.order_by('created_at').prefetch_related('attachments')
        
        history = []
        for msg in messages_queryset:
            role = msg.role
            content = msg.content or ""
            
            # Get attachments information (path for AI, URL for frontend if needed)
            attachments_data = []
            for att in msg.attachments.all():
                attachments_data.append({
                    "path": att.file.path,
                    "type": att.file_type
                })

            if history and history[-1]["role"] == role:
                # Merge with previous message
                history[-1]["content"] += f"\n{content}" if content and history[-1]["content"] else content
                if attachments_data:
                    if "attachments" not in history[-1]:
                        history[-1]["attachments"] = []
                    history[-1]["attachments"].extend(attachments_data)
            else:
                # Add new message
                msg_data = {
                    "role": role,
                    "content": content
                }
                if attachments_data:
                    msg_data["attachments"] = attachments_data
                history.append(msg_data)

        # 5. Get the AI Client
        provider = settings.get("provider", "gemini")
        ai_client = get_ai_client(provider)
        
        # System prompt - can be passed from settings or configured per conversation
        system_prompt = settings.get("system_prompt", "")

        # 6. Generator logic for SSE & DB Save
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
                # 7. Save Assistant response (no attachments for assistant in this implementation)
                Message.objects.create(
                    conversation=conversation,
                    role=Message.ROLE_ASSISTANT,
                    content=full_response,
                    metadata=final_metadata
                )
                
                # Signal end of stream
                yield "data: [DONE]\n\n"

        return stream_generator()
