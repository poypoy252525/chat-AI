from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import CursorPagination
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


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

    