import { API_BASE_URL, handleResponse, PaginatedResponse } from './core';

export interface ChatMessage {
  id: number;
  complain_id: number;
  message: string;
  is_edited: boolean;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  // Additional fields that might be added by the controller
  sender_name?: string;
  sender_type?: 'admin' | 'student' | 'staff';
  formatted_time?: string;
  preview?: string;
  can_edit?: boolean;
  can_delete?: boolean;
  edit_time_remaining?: number;
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
  message: string;
}

export interface EditMessageRequest {
  message: string;
}

export interface MarkAsReadRequest {
  complain_id: number;
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
    const response = await fetch(`${API_BASE_URL}/chats/send`, {
      method: 'POST',
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
  async deleteMessage(chatId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
