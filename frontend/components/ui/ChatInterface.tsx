"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Loader, Edit, Trash, X, Download, Image, File, Upload, Plus } from 'lucide-react';
import { chatApi, ChatMessage, ChatResponse, SendMessageRequest } from '@/lib/api/chat.api';

interface ChatInterfaceProps {
  complainId: number;
  currentUserId: number;
  currentUserType: 'admin' | 'student' | 'staff';
  currentUserName: string;
  className?: string;
}

// Simple time ago function
const timeAgo = (date: string) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default function ChatInterface({ 
  complainId, 
  currentUserId, 
  currentUserType, 
  currentUserName,
  className = ""
}: ChatInterfaceProps) {
  const [chatData, setChatData] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat messages
  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getComplaintChats(complainId);
      setChatData(response);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read when component loads
  const markAsRead = async () => {
    try {
      await chatApi.markAsRead({
        complain_id: complainId,
        reader_id: currentUserId,
        reader_type: currentUserType,
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    loadChats();
    markAsRead();
  }, [complainId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatData?.chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      setSending(true);
      
      const sendData: SendMessageRequest = {
        complain_id: complainId,
        sender_id: currentUserId,
        sender_type: currentUserType,
        message: message.trim(),
        message_type: attachments.length > 0 ? 'file' : 'text',
        attachments: attachments,
      };

      await chatApi.sendMessage(sendData);
      
      // Clear form
      setMessage('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reload chats
      await loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: number) => {
    if (!editingText.trim()) return;

    try {
      await chatApi.editMessage(messageId, {
        message: editingText.trim(),
        sender_id: currentUserId,
        sender_type: currentUserType,
      });
      
      setEditingMessageId(null);
      setEditingText('');
      await loadChats();
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await chatApi.deleteMessage(messageId, currentUserId, currentUserType);
      await loadChats();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render message
  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = msg.sender_id === currentUserId && msg.sender_type === currentUserType;
    const isEditing = editingMessageId === msg.id;

    return (
      <div
        key={msg.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          } ${msg.is_deleted ? 'opacity-50' : ''}`}
        >
          {/* Sender name */}
          <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mb-1`}>
            {msg.sender_name}
            {msg.sender_type === 'admin' && ' (Admin)'}
          </div>

          {/* Message content */}
          {msg.is_deleted ? (
            <div className="italic text-sm">This message was deleted</div>
          ) : isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editingText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEditMessage(msg.id)}
                  className="text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingMessageId(null);
                    setEditingText('');
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
              
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded ${
                        isOwnMessage ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      {attachment.mime_type.startsWith('image/') ? (
                        <Image className="w-4 h-4" />
                      ) : (
                        <File className="w-4 h-4" />
                      )}
                      <span className="text-xs flex-1">{attachment.filename}</span>
                      <span className="text-xs">{formatFileSize(attachment.size)}</span>
                      <button
                        className="p-1 hover:bg-gray-300 rounded"
                        onClick={() => window.open(attachment.path, '_blank')}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Message metadata */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <div>
              {timeAgo(msg.created_at)}
              {msg.is_edited && ' (edited)'}
            </div>
            
            {/* Action buttons */}
            {isOwnMessage && !msg.is_deleted && !isEditing && (
              <div className="flex gap-1">
                {msg.can_edit && (
                  <button
                    className="p-1 hover:bg-gray-300 rounded"
                    onClick={() => {
                      setEditingMessageId(msg.id);
                      setEditingText(msg.message);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
                {msg.can_delete && (
                  <button
                    className="p-1 hover:bg-gray-300 rounded"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Edit time remaining */}
          {isOwnMessage && !msg.is_deleted && msg.can_edit && msg.edit_time_remaining > 0 && (
            <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              Can edit for {Math.floor(msg.edit_time_remaining / 60)} more minutes
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-96 border rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b p-3 bg-gray-50">
        <h3 className="font-medium">
          Chat - {chatData?.complain.title}
        </h3>
        <div className="text-sm text-gray-500">
          {chatData?.total_messages || 0} messages
          {chatData?.unread_count ? ` • ${chatData.unread_count} unread` : ''}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {chatData?.chats && chatData.chats.length > 0 ? (
          <>
            {chatData.chats.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t p-3 space-y-2">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="space-y-1">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <File className="w-4 h-4" />
                <span className="text-sm flex-1">{file.name}</span>
                <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  className="p-1 hover:bg-gray-300 rounded"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          <textarea
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded resize-none"
            rows={2}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={sending || (!message.trim() && attachments.length === 0)}
            className="shrink-0"
          >
            {sending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
