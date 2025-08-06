import { API_BASE_URL, handleResponse } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
import { PaginatedResponse } from './core';

export interface NoticeFormData {
  title: string;
  description: string;
  schedule_time?: string; // Made optional for immediate vs scheduled notices
  status?: string; // 'active', 'inactive'
  target_type: string; // 'all', 'student', 'staff', 'specific_student', 'specific_staff', 'block'
  notice_type?: string; // 'general', 'urgent', 'event', 'announcement'
  notice_attachments?: File[];
  student_id?: number | null;
  staff_id?: number | null;
  block_id?: number | null;
}

export interface Notice extends Omit<NoticeFormData, 'notice_attachments'> {
  id: number;
  created_at: string;
  updated_at: string;
  notice_attachment?: string | null;
  attachments: {
    id: number;
    path: string;
    name: string;
    type: string;
  }[];
  // Related entity information
  student?: StudentForNotice | null;
  staff?: StaffForNotice | null;
  block?: BlockForNotice | null;
  // Target information from backend
  target_info?: {
    type: string;
    id?: number;
    name: string;
    identifier?: string;
    contact?: string;
    location?: string;
    rooms_count?: number;
  } | null;
  // Additional profile data added by backend
  profile_data?: any;
}

// Notice API functions
// Types for fetching students/staff/blocks for notice creation
export interface StudentForNotice {
  id: number;
  name: string;
  student_id: string;
  contact: string;
  email: string;
  image?: string;
  room?: {
    id: number;
    room_number: string;
    block?: {
      id: number;
      name: string;
      location: string;
    }
  };
  educational_institution?: string;
  level_of_study?: string;
}

export interface StaffForNotice {
  id: number;
  name: string;
  staff_id: string;
  contact: string;
  email: string;
  image?: string;
  educational_institution?: string;
  level_of_study?: string;
}

export interface BlockForNotice {
  id: number;
  name: string;
  location: string;
  manager_name: string;
  manager_contact: string;
  room_count: number;
  total_capacity?: number;
  vacant_beds?: number;
  remarks?: string;
  image?: string;
}

export const noticeApi = {
  // Get all notices with pagination
  async getNotices(page: number = 1): Promise<PaginatedResponse<Notice>> {
    const response = await fetch(`${API_BASE_URL}/notices?page=${page}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<Notice>>(response);
  },
  
  // Get students for notice selection
  async getStudentsForNotice(search: string = '', page: number = 1): Promise<PaginatedResponse<StudentForNotice>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    
    const response = await fetch(`${API_BASE_URL}/notices-create/students?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<StudentForNotice>>(response);
  },
  
  // Get staff for notice selection
  async getStaffForNotice(search: string = '', page: number = 1): Promise<PaginatedResponse<StaffForNotice>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    
    const response = await fetch(`${API_BASE_URL}/notices-create/staff?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<StaffForNotice>>(response);
  },
  
  // Get blocks for notice selection
  async getBlocksForNotice(search: string = '', page: number = 1): Promise<PaginatedResponse<BlockForNotice>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    
    const response = await fetch(`${API_BASE_URL}/notices-create/blocks?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<BlockForNotice>>(response);
  },

  // Get a single notice by ID
  async getNotice(id: string): Promise<Notice> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Notice>(response);
  },

  // Create a new notice
  async createNotice(noticeData: NoticeFormData): Promise<Notice> {
    // Check if we have files to upload
    const hasFiles = noticeData.notice_attachments && 
                     Array.isArray(noticeData.notice_attachments) && 
                     noticeData.notice_attachments.length > 0;
    
    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(noticeData).forEach(([key, value]) => {
        if (key === 'notice_attachments' && value) {
          // Add each file to form data
          Array.from(value as File[]).forEach((file, index) => {
            formData.append(`notice_attachments[${index}]`, file);
          });
        } else if (key === 'title' || key === 'description' || key === 'target_type') {
          // Always include required fields, even if empty
          formData.append(key, (value as string) || '');
        } else if (key === 'schedule_time' && (!value || value === '')) {
          // Skip empty schedule_time to let backend use default (now)
          return;
        } else if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
          // Only add non-empty primitive values for optional fields
          formData.append(key, value as string);
        }
      });

      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(), // Use FormData-specific headers without Content-Type
        body: formData,
      });
      
      return handleResponse<Notice>(response);
    } else {
      // Use JSON for simple form submission without files
      const cleanData = Object.entries(noticeData).reduce((acc: any, [key, value]) => {
        // Exclude file-related fields from JSON
        if (key === 'notice_attachments') {
          return acc; // Skip file attachments in JSON mode
        }
        // Include all required fields even if they are empty strings
        else if (key === 'title' || key === 'description' || key === 'target_type') {
          acc[key] = value || '';
        } else if (key === 'schedule_time' && (!value || value === '')) {
          // Skip empty schedule_time to let backend use default (now)
          return acc;
        } else if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
          // Only include primitive, non-empty values for optional fields
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanData),
      });
      
      return handleResponse<Notice>(response);
    }
  },

  // Update an existing notice
  async updateNotice(id: string, noticeData: NoticeFormData): Promise<Notice> {
    // Check if we have file attachments
    const hasFiles = noticeData.notice_attachments && noticeData.notice_attachments.length > 0;
    
    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('_method', 'PUT'); // For Laravel to handle as PUT request
      
      // Add all fields to FormData
      Object.entries(noticeData).forEach(([key, value]) => {
        if (key === 'notice_attachments' && value) {
          // Add each file to form data
          Array.from(value as File[]).forEach((file, index) => {
            formData.append(`notice_attachments[${index}]`, file);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value as string);
        }
      });

      const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'POST', // Use POST for multipart form data with _method=PUT
        headers: {
          ...getAuthHeaders()
          // Don't set Content-Type when sending FormData - browser will set it with boundary
        },
        body: formData,
      });
      
      return handleResponse<Notice>(response);
    } else {
      // Use regular PUT request for JSON data
      const cleanData = Object.entries(noticeData).reduce((acc: any, [key, value]) => {
        // Always include required fields
        if (key === 'title' || key === 'description' || key === 'target_type') {
          acc[key] = value || '';
        } else if (key === 'schedule_time' && (!value || value === '')) {
          // Skip empty schedule_time
          return acc;
        } else if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
          // Include non-empty primitive values
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'PUT', // Use PUT for JSON updates
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanData),
      });
      
      return handleResponse<Notice>(response);
    }
  },

  // Delete a notice
  async deleteNotice(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<void>(response);
  },
  
  // Delete an attachment from a notice
  async deleteAttachment(noticeId: string, attachmentId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${noticeId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<void>(response);
  }
};

export default noticeApi;
