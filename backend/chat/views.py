from django.http import StreamingHttpResponse
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import CursorPagination
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, StreamRequestSerializer
from .services.message_service import MessageService


class StandardResultsCursorPagination(CursorPagination):
    page_size = 10
    ordering = '-updated_at'


class MessagePagination(CursorPagination):
    page_size = 20
    ordering = 'created_at'


class ConversationViewSet(ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsCursorPagination

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MessageViewSet(ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination

    def get_queryset(self):
        return Message.objects.filter(
            conversation_id=self.kwargs['conversation_pk'],
            conversation__user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(conversation_id=self.kwargs['conversation_pk'])

    @action(detail=False, methods=['post'], url_path='stream')
    def stream(self, request, conversation_pk=None):
        """
        Endpoint to handle streaming AI responses via Server-Sent Events (SSE).
        """
        serializer = StreamRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_text = serializer.validated_data['content']
        images = serializer.validated_data.get('images', [])
        settings = serializer.validated_data.get('settings', {})
        
        # message_service encapsulates all the logic and returns a generator
        stream_gen = MessageService.handle_message_stream(
            conversation_id=conversation_pk,
            user=request.user,
            user_text=user_text,
            images=images,
            settings=settings
        )
        
        return StreamingHttpResponse(stream_gen, content_type='text/event-stream')

    