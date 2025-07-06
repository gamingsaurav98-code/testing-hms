import { API_BASE_URL, handleResponse } from './core';
import { Room, RoomFormData, Block } from './types';
import { PaginatedResponse } from './core';

// Room API functions
export const roomApi = {
  // Get all rooms with pagination
  async getRooms(page: number = 1): Promise<PaginatedResponse<Room>> {
    const response = await fetch(`${API_BASE_URL}/rooms?page=${page}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Room>>(response);
  },

  // Get a single room by ID
  async getRoom(id: string): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Room>(response);
  },

  // Create a new room
  async createRoom(data: RoomFormData): Promise<Room> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('room_name', data.room_name);
    formData.append('block_id', data.block_id);
    formData.append('capacity', String(data.capacity));
    formData.append('status', data.status);
    formData.append('room_type', data.room_type);
    
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
    formData.append('status', data.status);
    formData.append('room_type', data.room_type);
    
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
    
    return handleResponse<Block[]>(response);
  },
  
  // Hostel API removed as part of single-tenant conversion
};
