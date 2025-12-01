import { API_BASE_URL, handleResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';
import { Inquiry, InquiryFormData } from './types/inquiry.types';

// Staff Inquiry API functions (uses my-staff endpoints)
export const staffInquiryApi = {
  // Get all inquiries (staff view)
  async getInquiries(): Promise<{ status: string; data: Inquiry[] }> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/inquiries`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<{ status: string; data: Inquiry[] }>(response);
  },

  // Get a single inquiry by ID (staff view)
  async getInquiry(id: string): Promise<Inquiry> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/inquiries/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
    });
    
    const result = await handleResponse<{ status: string; data: Inquiry }>(response);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    }
    throw new Error('Invalid response format from server');
  },

  // Create a new inquiry (staff creates)
  async createInquiry(data: InquiryFormData): Promise<Inquiry> {
    console.log('API URL:', `${API_BASE_URL}/my-staff/inquiries`);
    console.log('Request data:', data);
    
    try {
      const response = await safeFetch(`${API_BASE_URL}/my-staff/inquiries`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        mode: 'cors',
        body: JSON.stringify({
          ...data,
          seater_type: parseInt(String(data.seater_type))
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

  // Update an existing inquiry (staff updates)
  async updateInquiry(id: string, data: InquiryFormData): Promise<Inquiry> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/inquiries/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
      body: JSON.stringify({
        ...data,
        seater_type: parseInt(String(data.seater_type))
      }),
    });

    return handleResponse<Inquiry>(response);
  },
};
