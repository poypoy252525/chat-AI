from django.contrib import admin
from .models import Conversation, Message

class MessageInline(admin.TabularInline):
    model = Message
    extra = 1

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at')
    list_filter = ('user', 'created_at', 'updated_at')
    search_fields = ('title', 'user__username')
    ordering = ('-created_at',)
    inlines = [MessageInline]

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('conversation__title', 'role', 'content', 'created_at', 'updated_at')
    list_filter = ('conversation', 'role', 'created_at', 'updated_at')
    search_fields = ('content', 'conversation__title')
    ordering = ('-created_at',)