import { API_BASE_URL, handleResponse } from './core';
import { Student } from './types';
import { PaginatedResponse } from './core';

// StudentAmenity interface
export interface StudentAmenity {
  id?: string;
  student_id?: string;
  name: string;
  description?: string;
}

// Extended Student interface with amenities
export interface StudentWithAmenities extends Student {
  amenities?: StudentAmenity[];
}

// Student form data interface
export interface StudentFormData {
  student_name: string;
  date_of_birth?: string;
  contact_number: string;
  email: string;
  district?: string;
  city_name?: string;
  ward_no?: string;
  street_name?: string;
  citizenship_no?: string;
  date_of_issue?: string;
  citizenship_issued_district?: string;
  educational_institution?: string;
  class_time?: string;
  level_of_study?: string;
  expected_stay_duration?: string;
  blood_group?: string;
  food?: string;
  disease?: string;
  father_name?: string;
  father_contact?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_contact?: string;
  mother_occupation?: string;
  spouse_name?: string;
  spouse_contact?: string;
  spouse_occupation?: string;
  local_guardian_name?: string;
  local_guardian_address?: string;
  local_guardian_contact?: string;
  local_guardian_occupation?: string;
  local_guardian_relation?: string;
  room_id?: string;
  is_active?: boolean;
  student_image?: File | null;
  student_citizenship_image?: File | null;
  registration_form_image?: File | null;
  amenities?: StudentAmenity[] | string[];
}

// Student API functions
export const studentApi = {
  // Get available amenities for student creation/edit
  async getAvailableAmenities(): Promise<StudentAmenity[]> {
    const response = await fetch(`${API_BASE_URL}/student-amenities`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentAmenity[]>(response);
  },
  // Get all students with pagination
  async getStudents(page: number = 1): Promise<PaginatedResponse<StudentWithAmenities>> {
    const url = `${API_BASE_URL}/students?page=${page}`;
    console.log(`Fetching students from: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Student API response status: ${response.status}`);
      return handleResponse<PaginatedResponse<StudentWithAmenities>>(response);
    } catch (error) {
      console.error('Network error fetching students:', error);
      throw error;
    }
  },

  // Get a single student by ID
  async getStudent(id: string): Promise<StudentWithAmenities> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentWithAmenities>(response);
  },

  // Create a new student
  async createStudent(data: StudentFormData): Promise<StudentWithAmenities> {
    const formData = new FormData();
    
    // Append all base form fields
    Object.entries(data).forEach(([key, value]) => {
      // Skip amenities as we'll handle them separately
      if (key !== 'amenities' && value !== undefined && value !== null) {
        if (key === 'student_image' || key === 'student_citizenship_image' || key === 'registration_form_image') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Handle amenities
    if (data.amenities && Array.isArray(data.amenities)) {
      // Check if amenities is an array of strings (IDs) or objects
      if (typeof data.amenities[0] === 'string') {
        // If it's an array of IDs, handle accordingly
        data.amenities.forEach((amenityId, index) => {
          // TypeScript needs a type assertion here
          formData.append(`amenities[${index}]`, amenityId as string);
        });
      } else {
        // Handle as array of objects
        (data.amenities as StudentAmenity[]).forEach((amenity, index) => {
          formData.append(`amenities[${index}][name]`, amenity.name);
          if (amenity.description) {
            formData.append(`amenities[${index}][description]`, amenity.description);
          }
        });
      }
    }

    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<StudentWithAmenities>(response);
  },

  // Update an existing student
  async updateStudent(id: string, data: StudentFormData): Promise<StudentWithAmenities> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all base form fields
    Object.entries(data).forEach(([key, value]) => {
      // Skip amenities as we'll handle them separately
      if (key !== 'amenities' && value !== undefined && value !== null) {
        if (key === 'student_image' || key === 'student_citizenship_image' || key === 'registration_form_image') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Handle amenities
    if (data.amenities && Array.isArray(data.amenities)) {
      // Check if amenities is an array of strings (IDs) or objects
      if (typeof data.amenities[0] === 'string') {
        // If it's an array of IDs, handle accordingly
        data.amenities.forEach((amenityId, index) => {
          // TypeScript needs a type assertion here
          formData.append(`amenities[${index}]`, amenityId as string);
        });
      } else {
        // Handle as array of objects (backward compatibility)
        (data.amenities as StudentAmenity[]).forEach((amenity, index) => {
          if (amenity.id) {
            formData.append(`amenities[${index}][id]`, amenity.id);
          }
          formData.append(`amenities[${index}][name]`, amenity.name);
          if (amenity.description) {
            formData.append(`amenities[${index}][description]`, amenity.description);
          }
        });
      }
    }

    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<StudentWithAmenities>(response);
  },

  // Delete a student
  async deleteStudent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
  
  // Upload a student image
  async uploadStudentImage(id: string, file: File): Promise<{ student_image: string }> {
    const formData = new FormData();
    formData.append('student_image', file);
    
    const response = await fetch(`${API_BASE_URL}/students/${id}/image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<{ student_image: string }>(response);
  }
};
