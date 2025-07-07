import { API_BASE_URL, handleResponse } from './core';
import { Room, RoomFormData, Block, Student } from './types';
import { PaginatedResponse } from './core';

// Room API functions
export const roomApi = {
  // Get all rooms with pagination
  async getRooms(page: number = 1, filters: {block_id?: string, has_vacancy?: boolean} = {}): Promise<PaginatedResponse<Room>> {
    // Build query string from filters
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    
    if (filters.block_id) {
      queryParams.append('block_id', filters.block_id);
    }
    
    if (filters.has_vacancy) {
      queryParams.append('has_vacancy', 'true');
    }
    
    const url = `${API_BASE_URL}/rooms?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Room>>(response);
  },

  // Get a single room by ID
  async getRoom(id: string, includeStudents: boolean = false): Promise<Room> {
    let url = `${API_BASE_URL}/rooms/${id}`;
    
    // Add query parameter to include students
    if (includeStudents) {
      url += '?include_students=true';
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Room>(response);
  },
  
  // Get all students in a room
  async getRoomStudents(roomId: string): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/students`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Student[]>(response);
  },

  // Create a new room
  async createRoom(data: RoomFormData): Promise<Room> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('room_name', data.room_name);
    formData.append('block_id', data.block_id);
    formData.append('capacity', String(data.capacity));
    
    // For manual room type, use the custom room type value
    if (data.room_type === 'manual' && data.custom_room_type) {
      formData.append('room_type', data.custom_room_type);
    } else {
      formData.append('room_type', data.room_type);
    }
    
    // Append file if present
    if (data.room_attachment) {
      formData.append('room_attachment', data.room_attachment);
    }

    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Room>(response);
  },

  // Update an existing room
  async updateRoom(id: string, data: RoomFormData): Promise<Room> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all form fields
    formData.append('room_name', data.room_name);
    formData.append('block_id', data.block_id);
    formData.append('capacity', String(data.capacity));
    
    // For manual room type, use the custom room type value
    if (data.room_type === 'manual' && data.custom_room_type) {
      formData.append('room_type', data.custom_room_type);
    } else {
      formData.append('room_type', data.room_type);
    }
    
    // Append file if present
    if (data.room_attachment) {
      formData.append('room_attachment', data.room_attachment);
    }

    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Room>(response);
  },

  // Delete a room
  async deleteRoom(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },

  // Get all blocks for dropdown selection
  async getBlocks(): Promise<Block[]> {
    const response = await fetch(`${API_BASE_URL}/blocks?all=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse<Block[] | any>(response);
    
    // Ensure we return an array even if the API response structure changes
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.data && Array.isArray(data.data)) {
      // Handle case where API returns a paginated response with a data property
      return data.data;
    } else {
      // Fallback to empty array if response is not what we expect
      console.error('Unexpected response format from blocks API:', data);
      return [];
    }
  },
  
  // Hostel API removed as part of single-tenant conversion
};
