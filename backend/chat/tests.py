from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from .models import Conversation, Message

User = get_user_model()

class StreamTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.conversation = Conversation.objects.create(
            user=self.user,
            title='Test Conversation',
            summary='Test'
        )
        self.url = reverse('conversation-messages-stream', kwargs={'conversation_pk': self.conversation.id})

    @patch('chat.services.message_service.get_ai_client')
    def test_stream_endpoint(self, mock_get_client):
        # Mock the AI Client
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        
        # Mock generate_stream to yield chunks
        def fake_stream(*args, **kwargs):
            yield {"text": "Hello, "}
            yield {"text": "World!"}
            yield {"text": "", "metadata": {"tokens": 5}}

        mock_client.generate_stream.return_value = fake_stream()

        payload = {
            "role": "user",
            "content": "Hi there",
            "settings": {"model": "gemini-2.5-flash"}
        }

        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/event-stream')

        # Consume the streaming response
        content = b"".join(response.streaming_content).decode('utf-8')
        
        self.assertIn('data: {"text": "Hello, "}\n\n', content)
        self.assertIn('data: {"text": "World!"}\n\n', content)
        self.assertIn('data: [DONE]\n\n', content)

        # Check that DB records were created
        messages = Message.objects.filter(conversation=self.conversation).order_by('created_at')
        self.assertEqual(messages.count(), 2)
        
        user_msg = messages.first()
        self.assertEqual(user_msg.role, 'user')
        self.assertEqual(user_msg.content, 'Hi there')

        assistant_msg = messages.last()
        self.assertEqual(assistant_msg.role, 'assistant')
        self.assertEqual(assistant_msg.content, 'Hello, World!')
        self.assertEqual(assistant_msg.metadata, {"tokens": 5})
