import { API_BASE_URL, handleResponse, PaginatedResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';
import { Inquiry, InquiryFormData } from './types/inquiry.types';

// Inquiry API functions
export const inquiryApi = {
  // Get all inquiries with pagination
  async getInquiries(page: number = 1): Promise<PaginatedResponse<Inquiry>> {
    const response = await safeFetch(`${API_BASE_URL}/inquiries?page=${page}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Inquiry>>(response);
  },

  // Get inquiries by block ID
  async getInquiriesByBlock(blockId: string, page: number = 1): Promise<PaginatedResponse<Inquiry>> {
    const response = await safeFetch(`${API_BASE_URL}/inquiries/block/${blockId}?page=${page}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Inquiry>>(response);
  },

  // Get a single inquiry by ID
  async getInquiry(id: string): Promise<Inquiry> {
    console.log('Getting inquiry with ID:', id);
    console.log('API URL:', `${API_BASE_URL}/inquiries/${id}`);
    
    const response = await safeFetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await handleResponse<{ status: string; data: Inquiry }>(response);
    console.log('Processed response data:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    }
    throw new Error('Invalid response format from server');
  },

  // Create a new inquiry
  async createInquiry(data: InquiryFormData): Promise<Inquiry> {
    console.log('API URL:', `${API_BASE_URL}/inquiries`);
    console.log('Request data:', data);
    
    try {
      const response = await safeFetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        mode: 'cors', // Explicitly set CORS mode
        body: JSON.stringify({
          ...data,
          seater_type: parseInt(String(data.seater_type)) // Ensure seater_type is a number
        }),
      });
      
      console.log('Full response:', response);
      console.log('Response status:', response.status);
      
      return handleResponse<Inquiry>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw error;
    }
  },

  // Update an existing inquiry
  async updateInquiry(id: string, data: InquiryFormData): Promise<Inquiry> {
    const response = await safeFetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse<Inquiry>(response);
  },

  // Delete an inquiry
  async deleteInquiry(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
  
  // Delete an attachment from an inquiry
  async deleteAttachment(inquiryId: string, attachmentId: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/inquiries/${inquiryId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
};
