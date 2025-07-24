"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Loader, Edit, Trash, ChevronRight, MoreVertical } from 'lucide-react';
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

// Check if message can be edited (within 5 minutes)
const canEditMessage = (createdAt: string) => {
  const now = new Date();
  const messageDate = new Date(createdAt);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  return diffMinutes < 5;
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
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    loadChats();
    markAsRead();
  }, [complainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatData?.chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);
      
      const sendData: SendMessageRequest = {
        complain_id: complainId,
        message: message.trim(),
      };

      const response = await chatApi.sendMessage(sendData);
      
      // Clear form
      setMessage('');
      
      // Add the new message to existing chat data instead of reloading
      if (chatData && response) {
        const newMessage: ChatMessage = {
          id: Date.now(), // Temporary ID
          complain_id: complainId,
          message: sendData.message,
          sender_name: currentUserName,
          sender_type: currentUserType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_edited: false,
          is_read: false
        };
        
        setChatData({
          ...chatData,
          chats: [...(chatData.chats || []), newMessage]
        });
      }
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
      await chatApi.deleteMessage(messageId);
      await loadChats();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle file selection - removed for simplified version
  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   // File upload functionality removed
  // };

  // Remove attachment - removed for simplified version  
  // const removeAttachment = (index: number) => {
  //   // File upload functionality removed
  // };

  // Format file size - removed for simplified version
  // const formatFileSize = (bytes: number) => {
  //   // File upload functionality removed
  // };

  // Render message
  const renderMessage = (msg: ChatMessage) => {
    // For admin users, their own messages appear on the right
    // For student users, their own messages appear on the right
    const isOwnMessage = msg.sender_type === currentUserType;
    const isEditing = editingMessageId === msg.id;
    const canEdit = canEditMessage(msg.created_at) && isOwnMessage;
    const isDropdownOpen = openDropdownId === msg.id;

    // Determine sender display name and styling
    const getSenderInfo = () => {
      if (msg.sender_type === 'admin') {
        return {
          name: 'Admin',
          color: 'text-blue-600',
          bgColor: isOwnMessage ? 'from-blue-500 to-blue-600' : 'bg-blue-50 border-blue-200'
        };
      } else if (msg.sender_type === 'student') {
        return {
          name: msg.sender_name || 'Student',
          color: 'text-green-600',
          bgColor: isOwnMessage ? 'from-green-500 to-green-600' : 'bg-green-50 border-green-200'
        };
      } else {
        return {
          name: msg.sender_name || 'User',
          color: 'text-gray-600',
          bgColor: isOwnMessage ? 'from-gray-500 to-gray-600' : 'bg-gray-50 border-gray-200'
        };
      }
    };

    const senderInfo = getSenderInfo();

    return (
      <div
        key={msg.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
      >
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%] relative`}>
          {/* Sender name and time */}
          <div className={`flex items-center space-x-2 mb-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className={`text-xs font-semibold ${senderInfo.color}`}>
              {senderInfo.name}
            </span>
            <span className="text-xs text-gray-500">
              {timeAgo(msg.created_at)}
              {msg.is_edited && <span className="ml-1 text-gray-400">(edited)</span>}
            </span>
          </div>

          {/* Message bubble with three dots */}
          <div className={`flex items-start ${isOwnMessage ? 'flex-row-reverse' : ''} space-x-2 w-full`}>
            {/* Message bubble */}
            <div className="relative">
              <div
                className={`rounded-2xl px-4 py-3 shadow-sm border transform transition-all duration-300 hover:shadow-md ${
                  isOwnMessage
                    ? `bg-gradient-to-br ${senderInfo.bgColor} text-white border-transparent rounded-br-md`
                    : `${senderInfo.bgColor} text-gray-900 rounded-bl-md shadow-md`
                }`}
                style={{
                  animation: 'slideInMessage 0.3s ease-out'
                }}
              >
                {/* Message content */}
                {isEditing ? (
                  <div className="space-y-3 min-w-[200px]">
                    <textarea
                      value={editingText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleEditMessage(msg.id)}
                        className="text-xs h-7 px-3 bg-blue-500 hover:bg-blue-600"
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
                        className="text-xs h-7 px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isOwnMessage ? 'text-white' : 'text-gray-800'
                  }`}>
                    {msg.message}
                  </div>
                )}
              </div>
            </div>

            {/* Three dots menu - only for own messages */}
            {isOwnMessage && !isEditing && (
              <div className="flex-shrink-0 mt-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpenDropdownId(isDropdownOpen ? null : msg.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 opacity-60 hover:opacity-100 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 min-w-[140px]">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditingText(msg.message);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDeleteMessage(msg.id);
                          setOpenDropdownId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
    <div className={`flex flex-col h-full bg-gray-50/30 rounded-lg ${className}`}>
      <style jsx>{`
        @keyframes slideInMessage {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-gradient-to-b from-gray-50/50 to-white" 
        style={{
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
      >
        {chatData?.chats && chatData.chats.length > 0 ? (
          <>
            {chatData.chats.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-sm text-gray-600 max-w-xs leading-relaxed">Start the conversation by sending a message below to help resolve this complaint.</p>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 bg-white p-5 rounded-b-lg">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 placeholder-gray-500 overflow-hidden"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          
          <div className="flex-shrink-0">
            <Button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className="h-12 w-12 rounded-full p-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
              size="sm"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin text-white" />
              ) : (
                <ChevronRight className="w-5 h-5 text-white ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
