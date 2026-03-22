from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'metadata', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'summary', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StreamRequestSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Message.ROLE_CHOICES, default=Message.ROLE_USER)
    content = serializers.CharField()
    settings = serializers.DictField(required=False, default=dict)
