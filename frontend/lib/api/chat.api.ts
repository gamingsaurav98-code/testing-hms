import { API_BASE_URL, handleResponse, PaginatedResponse } from './core';

export interface ChatMessage {
  id: number;
  complain_id: number;
  sender_id: number;
  sender_type: 'admin' | 'student' | 'staff';
  sender_name: string;
  message: string;
  original_message?: string;
  is_edited: boolean;
  is_read: boolean;
  is_deleted: boolean;
  message_type: 'text' | 'file' | 'image';
  attachments?: Array<{
    filename: string;
    path: string;
    size: number;
    mime_type: string;
  }>;
  can_edit: boolean;
  can_delete: boolean;
  edit_time_remaining: number;
  created_at: string;
  edited_at?: string;
  read_at?: string;
  deleted_at?: string;
}

export interface ChatComplaint {
  id: number;
  title: string;
  status: string;
}

export interface ChatResponse {
  complain: ChatComplaint;
  chats: ChatMessage[];
  total_messages: number;
  unread_count: number;
}

export interface SendMessageRequest {
  complain_id: number;
  sender_id: number;
  sender_type: 'admin' | 'student' | 'staff';
  message?: string;
  message_type?: 'text' | 'file' | 'image';
  attachments?: File[];
}

export interface EditMessageRequest {
  message: string;
  sender_id: number;
  sender_type: 'admin' | 'student' | 'staff';
}

export interface MarkAsReadRequest {
  complain_id: number;
  reader_id: number;
  reader_type: 'admin' | 'student' | 'staff';
}

export interface UnreadCountRequest {
  user_id: number;
  user_type: 'admin' | 'student' | 'staff';
  complain_id?: number;
}

export const chatApi = {
  /**
   * Get all chat messages for a specific complaint
   */
  async getComplaintChats(complainId: number): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chats/complaint/${complainId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<{ data: ChatResponse }>(response);
    return result.data;
  },

  /**
   * Send a new chat message
   */
  async sendMessage(data: SendMessageRequest): Promise<ChatMessage> {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('complain_id', data.complain_id.toString());
    formData.append('sender_id', data.sender_id.toString());
    formData.append('sender_type', data.sender_type);
    
    if (data.message) {
      formData.append('message', data.message);
    }
    
    if (data.message_type) {
      formData.append('message_type', data.message_type);
    }
    
    // Add attachments if any
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/chats/send`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    const result = await handleResponse<{ data: ChatMessage }>(response);
    return result.data;
  },

  /**
   * Edit a chat message
   */
  async editMessage(chatId: number, data: EditMessageRequest): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/edit`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<{ data: ChatMessage }>(response);
    return result.data;
  },

  /**
   * Delete a chat message
   */
  async deleteMessage(chatId: number, senderId: number, senderType: 'admin' | 'student' | 'staff'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: senderId,
        sender_type: senderType,
      }),
    });
    
    return handleResponse<void>(response);
  },

  /**
   * Mark messages as read
   */
  async markAsRead(data: MarkAsReadRequest): Promise<{ marked_count: number }> {
    const response = await fetch(`${API_BASE_URL}/chats/mark-read`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse<{ marked_count: number }>(response);
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(data: UnreadCountRequest): Promise<{ unread_count: number }> {
    const params = new URLSearchParams({
      user_id: data.user_id.toString(),
      user_type: data.user_type,
    });
    
    if (data.complain_id) {
      params.append('complain_id', data.complain_id.toString());
    }

    const response = await fetch(`${API_BASE_URL}/chats/unread-count?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<{ unread_count: number }>(response);
  },

  /**
   * Upload file attachment
   */
  async uploadAttachment(file: File): Promise<{ path: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/chats/upload-attachment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<{ path: string; filename: string }>(response);
  },
};
