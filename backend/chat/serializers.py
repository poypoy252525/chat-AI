from rest_framework import serializers
from .models import Conversation, Message, MessageAttachment
from .services.summary_service import SummaryService

class ImageSerializer(serializers.Serializer):
    type = serializers.CharField()
    data = serializers.CharField() # base64 string

class MessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAttachment
        fields = ['id', 'file', 'file_type', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'attachments', 'metadata', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConversationSerializer(serializers.ModelSerializer):
    initial_message = serializers.CharField(write_only=True, required=False, allow_blank=True)
    images = ImageSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'summary', 'initial_message', 'images', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'title': {'required': False},
            'summary': {'required': False}
        }

    def create(self, validated_data):
        initial_message = validated_data.pop('initial_message', None)
        images = validated_data.pop('images', None)
        
        # Determine effective text for summary/title
        effective_text = initial_message or ""
        if not effective_text and images:
            effective_text = "[Image Message]"

        if not validated_data.get('title') and effective_text:
            # Generate title using AI
            validated_data['title'] = SummaryService.generate_title(effective_text)
        elif not validated_data.get('title'):
            validated_data['title'] = "New Conversation"
            
        if not validated_data.get('summary') and effective_text:
            validated_data['summary'] = SummaryService.generate_summary(effective_text)
        elif not validated_data.get('summary'):
            validated_data['summary'] = "No summary available"
            
        instance = super().create(validated_data)
        return instance

class StreamRequestSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Message.ROLE_CHOICES, default=Message.ROLE_USER)
    content = serializers.CharField()
    images = ImageSerializer(many=True, required=False)
    settings = serializers.DictField(required=False, default=dict)
