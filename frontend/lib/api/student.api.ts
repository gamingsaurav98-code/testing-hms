import { API_BASE_URL, handleResponse, safeFetch, fetchWithTimeout, DEFAULT_API_TIMEOUT } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
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
    const response = await safeFetch(`${API_BASE_URL}/student-amenities`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentAmenity[]>(response);
  },
  
  // Get students by room ID
  async getStudentsByRoom(roomId: string, signal?: AbortSignal, { timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ timeoutMs?: number, retries?: number, forceRefresh?: boolean } = {}): Promise<StudentWithAmenities[]> {
    const url = `${API_BASE_URL}/rooms/${roomId}/students`;
    const cacheKey = `students:room:${roomId}`;
    const TTL = 3000; // 3s
    const now = Date.now();

    // In-memory cache stored on module-level studentApi (we'll add it later if absent)
    // Attempt to read cached value
    // @ts-expect-error -- module-level cache is attached dynamically at runtime; TS doesn't know about it
    if (!forceRefresh && studentApi._studentsCache && studentApi._studentsCache.has(cacheKey)) {
      // @ts-expect-error -- cached type is dynamic and initialized lazily, assert presence for runtime
      const cached = studentApi._studentsCache.get(cacheKey)!;
      if ((now - cached.fetchedAt) < TTL) return Promise.resolve(cached.data as StudentWithAmenities[]);
    }

    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const resp = await fetchWithTimeout(url, { method: 'GET', headers: { ...getAuthHeaders(), 'Accept': 'application/json', 'Content-Type': 'application/json' }, signal }, timeoutMs);
        const data = await handleResponse<StudentWithAmenities[]>(resp);
        // @ts-expect-error -- writing into a runtime-initialized cache map; TS type not declared
        if (studentApi._studentsCache) studentApi._studentsCache.set(cacheKey, { data, fetchedAt: Date.now() });
        return data;
      } catch (err) {
        if (attempt > retries) throw err;
        const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 200);
        await new Promise(r => setTimeout(r, backoff + jitter));
      }
    }
  },
  
  // Get all active students (no pagination)
  async getAllActiveStudents(signal?: AbortSignal, { timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ timeoutMs?: number, retries?: number, forceRefresh?: boolean } = {}): Promise<StudentWithAmenities[]> {
    const url = `${API_BASE_URL}/students?all=true`;
    const cacheKey = `students:all:true`;
    const TTL = 3000;
    const now = Date.now();

    // @ts-expect-error -- module-level cache map is attached dynamically, not typed in this file
    if (!forceRefresh && studentApi._studentsCache && studentApi._studentsCache.has(cacheKey)) {
      // @ts-expect-error -- referencing runtime-initialized _studentsCache map, suppress static error
      const cached = studentApi._studentsCache.get(cacheKey)!;
      if ((now - cached.fetchedAt) < TTL) return Promise.resolve(cached.data as StudentWithAmenities[]);
    }

    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const resp = await fetchWithTimeout(url, { method: 'GET', headers: { ...getAuthHeaders(), 'Accept': 'application/json', 'Content-Type': 'application/json' }, signal }, timeoutMs);
        const data = await handleResponse<StudentWithAmenities[]>(resp);
        // @ts-expect-error -- _studentsCache may be undefined to TS but is lazily created at runtime
        if (studentApi._studentsCache) studentApi._studentsCache.set(cacheKey, { data, fetchedAt: Date.now() });
        return data;
      } catch (err) {
        if (attempt > retries) throw err;
        const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 200);
        await new Promise(r => setTimeout(r, backoff + jitter));
      }
    }
  },
  // Get all students with pagination
  async getStudents(page: number = 1, signal?: AbortSignal, { timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ timeoutMs?: number, retries?: number, forceRefresh?: boolean } = {}): Promise<PaginatedResponse<StudentWithAmenities>> {
    const url = `${API_BASE_URL}/students?page=${page}`;
    console.log(`Fetching students from: ${url}`);
    
    try {
      const cacheKey = `students:page=${page}`;
      const TTL = 3000;
      const now = Date.now();

      if (!forceRefresh && studentApi._studentsCache.has(cacheKey)) {
        const cached = studentApi._studentsCache.get(cacheKey)!;
        if ((now - cached.fetchedAt) < TTL) return Promise.resolve(cached.data as PaginatedResponse<StudentWithAmenities>);
      }

      if (!forceRefresh && studentApi._studentsPromises.has(cacheKey)) {
        return studentApi._studentsPromises.get(cacheKey) as Promise<PaginatedResponse<StudentWithAmenities>>;
      }

      const inflight = (async () => {
        const start = Date.now();
        let attempt = 0;
        while (true) {
          attempt++;
          try {
            const response = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders(), signal }, timeoutMs);
            const took = Date.now() - start;
            console.log(`Student API response status: ${response.status} (took ${took}ms)`);
            const data = await handleResponse<PaginatedResponse<StudentWithAmenities>>(response);
            studentApi._studentsCache.set(cacheKey, { data, fetchedAt: Date.now() });
            return data;
          } catch (err) {
            console.debug('Student API network failure or aborted:', err?.message ?? err);
            if (attempt > retries) throw err;
            const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
            const jitter = Math.floor(Math.random() * 200);
            await new Promise(r => setTimeout(r, backoff + jitter));
          }
        }
      })();

      if (!forceRefresh) studentApi._studentsPromises.set(cacheKey, inflight as Promise<PaginatedResponse<StudentWithAmenities>>);
      try { return await inflight as PaginatedResponse<StudentWithAmenities>; } finally { studentApi._studentsPromises.delete(cacheKey); }
    } catch (error) {
      // Convert raw failures into ApiError (safeFetch already does this),
      // but keep a friendly console message for debugging.
      console.debug('Student API network failure or aborted:', error?.message ?? error);
      throw error;
    }
  },

  // Get a single student by ID
  async getStudent(id: string, signal?: AbortSignal): Promise<StudentWithAmenities> {
    const response = await safeFetch(`${API_BASE_URL}/students/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        signal,
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

    const response = await safeFetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
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
    const removedCitizenshipDocIds = (data as unknown as { removedCitizenshipDocIds?: number[] }).removedCitizenshipDocIds;
    if (removedCitizenshipDocIds && Array.isArray(removedCitizenshipDocIds)) {
      removedCitizenshipDocIds.forEach((id: number, index: number) => {
        formData.append(`removedCitizenshipDocIds[${index}]`, String(id));
      });
    }
    
    // Handle removed registration document IDs
    const removedRegistrationDocIds = (data as unknown as { removedRegistrationDocIds?: number[] }).removedRegistrationDocIds;
    if (removedRegistrationDocIds && Array.isArray(removedRegistrationDocIds)) {
      removedRegistrationDocIds.forEach((id: number, index: number) => {
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

    const response = await safeFetch(`${API_BASE_URL}/students/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<StudentWithAmenities>(response);
  },

  // Delete a student
  async deleteStudent(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },

  // Toggle student status (activate/deactivate)
  async toggleStudentStatus(id: string): Promise<{message: string, student: StudentWithAmenities, is_active: boolean, room_removed?: boolean}> {
    const response = await safeFetch(`${API_BASE_URL}/students/${id}/toggle-status`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<{message: string, student: StudentWithAmenities, is_active: boolean, room_removed?: boolean}>(response);
  },

  // Student-specific methods
  // Get current student's profile
  async getStudentProfile(): Promise<StudentWithAmenities> {
    const response = await safeFetch(`${API_BASE_URL}/student/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<StudentWithAmenities>(response);
  },

  // Get current student's complaints
  async getStudentComplains(): Promise<unknown> {
    const response = await safeFetch(`${API_BASE_URL}/student/complains`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<unknown>(response);
  },

  // Get current student's payment history
  async getStudentPayments(): Promise<unknown> {
    const response = await safeFetch(`${API_BASE_URL}/student/payment-history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<unknown>(response);
  },

  // Get current student's check-in/out records
  async getStudentCheckInOuts(): Promise<unknown> {
    const response = await safeFetch(`${API_BASE_URL}/student/checkincheckouts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<unknown>(response);
  },

  // Get current student's notices
  async getStudentNotices(): Promise<unknown> {
    const response = await safeFetch(`${API_BASE_URL}/student/notices`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<unknown>(response);
  },

  // Get a specific student notice by ID
  async getStudentNotice(id: string): Promise<unknown> {
    const response = await safeFetch(`${API_BASE_URL}/student/notices/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<unknown>(response);
  },

  // Get current student's outstanding dues
  async getStudentOutstandingDues(): Promise<{
    outstanding_dues: number;
    generated_fees: number;
    total_payments: number;
    balance_due: number;
    calculation_date: string;
  }> {
    const response = await safeFetch(`${API_BASE_URL}/student/outstanding-dues`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<{
      outstanding_dues: number;
      generated_fees: number;
      total_payments: number;
      balance_due: number;
      calculation_date: string;
    }>(response);
  },
  
  // Upload a student image
  async uploadStudentImage(id: string, file: File): Promise<{ student_image: string }> {
    const formData = new FormData();
    formData.append('student_image', file);
    
    const response = await safeFetch(`${API_BASE_URL}/students/${id}/image`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<{ student_image: string }>(response);
  },

  // Create a new student complaint
  async createStudentComplaint(data: {
    title: string;
    description: string;
    complain_attachment?: File;
  }): Promise<unknown> {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.complain_attachment) {
      formData.append('complain_attachment', data.complain_attachment);
    }

    const response = await safeFetch(`${API_BASE_URL}/student/complains`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<unknown>(response);
  },

  // Get a specific student complaint
  async getStudentComplaint(id: string): Promise<unknown> {
    const response = await safeFetch(`${API_BASE_URL}/student/complains/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<unknown>(response);
  },

  // Update a specific student complaint
  async updateStudentComplaint(id: string, data: {
    title: string;
    description: string;
    complain_attachment?: File;
  }): Promise<unknown> {
    const formData = new FormData();
    
    formData.append('_method', 'PUT');
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.complain_attachment) {
      formData.append('complain_attachment', data.complain_attachment);
    }

    const response = await safeFetch(`${API_BASE_URL}/student/complains/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<unknown>(response);
  },

  // Delete a specific student complaint
  async deleteStudentComplaint(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/student/complains/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<void>(response);
  }
};

// Initialize runtime caches on the exported object so callers can safely use
// studentApi._studentsCache and studentApi._studentsPromises without null checks.
// These are populated lazily but must exist to avoid runtime TypeErrors like
// "Cannot read properties of undefined (reading 'has')" when code calls .has/.get.
type _StudentCacheEntry = { data: unknown; fetchedAt: number };

// Concrete runtime shape for the small pieces of state we attach to studentApi
type StudentApiRuntime = {
  _studentsCache?: Map<string, _StudentCacheEntry>;
  _studentsPromises?: Map<string, Promise<unknown>>;
};

const runtime = studentApi as unknown as StudentApiRuntime;
runtime._studentsCache = runtime._studentsCache ?? new Map<string, _StudentCacheEntry>();
runtime._studentsPromises = runtime._studentsPromises ?? new Map<string, Promise<unknown>>();

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

    const response = await safeFetch(`${API_BASE_URL}/student-financials`, {
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

    const response = await safeFetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<StudentFinancial>(response);
  },

  // Get financial records for a specific student
  async getStudentFinancials(studentId: string): Promise<StudentFinancial[]> {
    const response = await safeFetch(`${API_BASE_URL}/students/${studentId}/financials`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentFinancial[]>(response);
  },

  // Get a specific financial record
  async getStudentFinancial(id: string): Promise<StudentFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StudentFinancial>(response);
  },

  // Delete financial record
  async deleteStudentFinancial(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  }
};
