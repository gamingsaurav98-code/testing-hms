import { API_BASE_URL, handleResponse, PaginatedResponse } from './core';
import { getAuthHeaders } from './auth.api';

export interface Complain {
  id: number;
  title: string;
  description: string;
  student_id?: number;
  staff_id?: number;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  complain_attachment?: string;
  total_messages: number;
  unread_messages: number;
  unread_admin_messages?: number;
  unread_student_messages?: number;
  unread_staff_messages?: number;
  last_message_at?: string;
  last_message_by?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: number;
    student_name: string;
    contact_number: string;
  };
  staff?: {
    id: number;
    staff_name: string;
    contact_number: string;
  };
  chats_count?: number;
  unread_chats_count?: number;
  chats?: any[];
}

export interface ComplainFormData {
  title: string;
  description: string;
  student_id?: number;
  staff_id?: number;
  status?: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  complain_attachment?: File;
}

export const complainApi = {
  // Get all complains with pagination
  async getComplains(page: number = 1): Promise<PaginatedResponse<Complain>> {
    const response = await fetch(`${API_BASE_URL}/complains?page=${page}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<Complain>>(response);
  },

  // Get all complains without pagination
  async getAllComplains(): Promise<Complain[]> {
    const response = await fetch(`${API_BASE_URL}/complains?all=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Complain[]>(response);
  },

  // Get a single complain by ID
  async getComplain(id: string): Promise<Complain> {
    const response = await fetch(`${API_BASE_URL}/complains/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Complain>(response);
  },

  // Create a new complain
  async createComplain(data: ComplainFormData): Promise<Complain> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.student_id) formData.append('student_id', data.student_id.toString());
    if (data.staff_id) formData.append('staff_id', data.staff_id.toString());
    if (data.status) formData.append('status', data.status);
    if (data.complain_attachment) formData.append('complain_attachment', data.complain_attachment);

    const response = await fetch(`${API_BASE_URL}/complains`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Complain>(response);
  },

  // Update an existing complain
  async updateComplain(id: string, data: ComplainFormData): Promise<Complain> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.student_id) formData.append('student_id', data.student_id.toString());
    if (data.staff_id) formData.append('staff_id', data.staff_id.toString());
    if (data.status) formData.append('status', data.status);
    if (data.complain_attachment) formData.append('complain_attachment', data.complain_attachment);
    
    // Add method override for PUT
    formData.append('_method', 'PUT');

    const response = await fetch(`${API_BASE_URL}/complains/${id}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Complain>(response);
  },

  // Delete a complain
  async deleteComplain(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/complains/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
};
