from rest_framework import serializers
from .models import Conversation, Message
from .services.summary_service import SummaryService

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'metadata', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConversationSerializer(serializers.ModelSerializer):
    initial_message = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'summary', 'initial_message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'title': {'required': False},
            'summary': {'required': False}
        }

    def create(self, validated_data):
        initial_message = validated_data.pop('initial_message', None)
        if not validated_data.get('title') and initial_message:
            # Generate title using AI
            validated_data['title'] = SummaryService.generate_title(initial_message)
        elif not validated_data.get('title'):
            validated_data['title'] = "New Conversation"
            
        if not validated_data.get('summary') and initial_message:
            validated_data['summary'] = SummaryService.generate_summary(initial_message)
        elif not validated_data.get('summary'):
            validated_data['summary'] = "No summary available"
            
        return super().create(validated_data)

class StreamRequestSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Message.ROLE_CHOICES, default=Message.ROLE_USER)
    content = serializers.CharField()
    settings = serializers.DictField(required=False, default=dict)
