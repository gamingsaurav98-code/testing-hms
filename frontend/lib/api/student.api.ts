import { API_BASE_URL, handleResponse } from './core';
import { getAuthHeaders } from './auth.api';
import { Student } from './types';
import { PaginatedResponse } from './core';

// StudentAmenity interface
export interface StudentAmenity {
  id?: string;
  student_id?: string;
  name: string;
  description?: string;
}

// StudentFinancial interface
export interface StudentFinancial {
  id?: string;
  student_id?: string;
  admission_fee?: string;
  form_fee?: string;
  security_deposit?: string;
  monthly_fee?: string;
  room_fee?: string;
  other_fee?: string;
  discount_amount?: string;
  joining_date?: string;
  payment_type_id?: string;
  payment_type?: {
    id: string;
    name: string;
    description?: string;
  };
  created_at: string;
  updated_at?: string;
}

// Extended Student interface with amenities and financials
export interface StudentWithAmenities extends Student {
  amenities?: StudentAmenity[];
  financials?: StudentFinancial[];
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
  student_id?: string;
  is_existing_student?: boolean;
  declaration_agreed?: boolean;
  rules_agreed?: boolean;
  verified_on?: string;
  // Image fields
  student_image?: File | null;
  student_citizenship_image?: File | null;
  registration_form_image?: File | null;
  amenities?: StudentAmenity[] | string[];
  removedAmenityIds?: number[];
  removedCitizenshipDocIds?: number[];
  removedRegistrationDocIds?: number[];
}

// Student financial form data interface
export interface StudentFinancialFormData {
  admission_fee?: string;
  form_fee?: string;
  security_deposit?: string;
  monthly_fee?: string;
  joining_date?: string;
  payment_date: string;
  amount?: string;
  payment_type_id?: string;
  remark?: string;
  is_existing_student?: boolean;
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
  
  // Get students by room ID
  async getStudentsByRoom(roomId: string): Promise<StudentWithAmenities[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/students`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentWithAmenities[]>(response);
  },
  
  // Get all active students (no pagination)
  async getAllActiveStudents(): Promise<StudentWithAmenities[]> {
    const response = await fetch(`${API_BASE_URL}/students?all=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentWithAmenities[]>(response);
  },
  // Get all students with pagination
  async getStudents(page: number = 1): Promise<PaginatedResponse<StudentWithAmenities>> {
    const url = `${API_BASE_URL}/students?page=${page}`;
    console.log(`Fetching students from: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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
      // Skip amenities and removed tracking arrays as we'll handle them separately
      if (key !== 'amenities' && key !== 'removedAmenityIds' && key !== 'removedCitizenshipDocIds' && key !== 'removedRegistrationDocIds' && value !== undefined && value !== null) {
        if (key === 'student_image' || key === 'student_citizenship_image' || key === 'registration_form_image') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Handle removed amenity IDs
    if (data.removedAmenityIds && Array.isArray(data.removedAmenityIds)) {
      data.removedAmenityIds.forEach((id: number, index: number) => {
        formData.append(`removedAmenityIds[${index}]`, String(id));
      });
    }
    
    // Handle removed citizenship document IDs
    if ((data as any).removedCitizenshipDocIds && Array.isArray((data as any).removedCitizenshipDocIds)) {
      (data as any).removedCitizenshipDocIds.forEach((id: number, index: number) => {
        formData.append(`removedCitizenshipDocIds[${index}]`, String(id));
      });
    }
    
    // Handle removed registration document IDs
    if ((data as any).removedRegistrationDocIds && Array.isArray((data as any).removedRegistrationDocIds)) {
      (data as any).removedRegistrationDocIds.forEach((id: number, index: number) => {
        formData.append(`removedRegistrationDocIds[${index}]`, String(id));
      });
    }
    
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

  // Student-specific methods
  // Get current student's profile
  async getStudentProfile(): Promise<StudentWithAmenities> {
    const response = await fetch(`${API_BASE_URL}/student/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<StudentWithAmenities>(response);
  },

  // Get current student's complaints
  async getStudentComplains(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/student/complains`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current student's payment history
  async getStudentPayments(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/student/payment-history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current student's check-in/out records
  async getStudentCheckInOuts(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/student/checkincheckouts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current student's notices
  async getStudentNotices(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/student/notices`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
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

// Student Financial API functions
export const studentFinancialApi = {
  // Create financial record for a student
  async createStudentFinancial(data: {
    student_id: string;
    admission_fee?: string;
    form_fee?: string;
    security_deposit?: string;
    monthly_fee?: string;
    joining_date?: string;
    payment_date: string;
    amount: string;
    payment_type_id?: string;
    remark?: string;
    is_existing_student?: boolean;
  }): Promise<StudentFinancial> {
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.keys(data).forEach(key => {
      const value = data[key as keyof typeof data];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'is_existing_student') {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/student-financials`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<StudentFinancial>(response);
  },

  // Update financial record
  async updateStudentFinancial(id: string, data: {
    admission_fee?: string;
    form_fee?: string;
    security_deposit?: string;
    monthly_fee?: string;
    joining_date?: string;
    payment_date?: string;
    amount?: string;
    payment_type_id?: string;
    remark?: string;
    is_existing_student?: boolean;
  }): Promise<StudentFinancial> {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    
    // Add all fields to FormData
    Object.keys(data).forEach(key => {
      const value = data[key as keyof typeof data];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'is_existing_student') {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<StudentFinancial>(response);
  },

  // Get financial records for a specific student
  async getStudentFinancials(studentId: string): Promise<StudentFinancial[]> {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/financials`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentFinancial[]>(response);
  },

  // Get a specific financial record
  async getStudentFinancial(id: string): Promise<StudentFinancial> {
    const response = await fetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentFinancial>(response);
  },

  // Delete financial record
  async deleteStudentFinancial(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  }
};
