import { API_BASE_URL, handleResponse, PaginatedResponse } from './core';
import { Inquiry, InquiryFormData } from './types/inquiry.types';

// Inquiry API functions
export const inquiryApi = {
  // Get all inquiries with pagination
  async getInquiries(page: number = 1): Promise<PaginatedResponse<Inquiry>> {
    const response = await fetch(`${API_BASE_URL}/inquiries?page=${page}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Inquiry>>(response);
  },

  // Get inquiries by block ID
  async getInquiriesByBlock(blockId: string, page: number = 1): Promise<PaginatedResponse<Inquiry>> {
    const response = await fetch(`${API_BASE_URL}/inquiries/block/${blockId}?page=${page}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Inquiry>>(response);
  },

  // Get a single inquiry by ID
  async getInquiry(id: string): Promise<Inquiry> {
    const response = await fetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Inquiry>(response);
  },

  // Create a new inquiry
  async createInquiry(data: InquiryFormData): Promise<Inquiry> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('name', data.name);
    
    if (data.email) {
      formData.append('email', data.email);
    }
    
    formData.append('phone', data.phone);
    formData.append('block_id', data.block_id);
    
    if (data.seater !== undefined) {
      formData.append('seater', data.seater.toString());
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // Append inquiry seaters if present
    if (data.inquiry_seaters && data.inquiry_seaters.length > 0) {
      data.inquiry_seaters.forEach((seater: { id?: string; room_id: string; capacity: number }, index: number) => {
        if (seater.id) {
          formData.append(`inquiry_seaters[${index}][id]`, seater.id);
        }
        formData.append(`inquiry_seaters[${index}][room_id]`, seater.room_id);
        formData.append(`inquiry_seaters[${index}][capacity]`, seater.capacity.toString());
      });
    }
    
    // Append attachments if present
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file: File, index: number) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/inquiries`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Inquiry>(response);
  },

  // Update an existing inquiry
  async updateInquiry(id: string, data: InquiryFormData): Promise<Inquiry> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all form fields
    formData.append('name', data.name);
    
    if (data.email) {
      formData.append('email', data.email);
    }
    
    formData.append('phone', data.phone);
    formData.append('block_id', data.block_id);
    
    if (data.seater !== undefined) {
      formData.append('seater', data.seater.toString());
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // Append inquiry seaters if present
    if (data.inquiry_seaters && data.inquiry_seaters.length > 0) {
      data.inquiry_seaters.forEach((seater: { id?: string; room_id: string; capacity: number }, index: number) => {
        if (seater.id) {
          formData.append(`inquiry_seaters[${index}][id]`, seater.id);
        }
        formData.append(`inquiry_seaters[${index}][room_id]`, seater.room_id);
        formData.append(`inquiry_seaters[${index}][capacity]`, seater.capacity.toString());
      });
    }
    
    // Append new attachments if present
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file: File, index: number) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Inquiry>(response);
  },

  // Delete an inquiry
  async deleteInquiry(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
  
  // Delete an attachment from an inquiry
  async deleteAttachment(inquiryId: string, attachmentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
};
