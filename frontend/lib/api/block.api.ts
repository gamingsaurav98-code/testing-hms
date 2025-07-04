import { API_BASE_URL, handleResponse } from './core';
import { Block, BlockFormData } from './types';
import { PaginatedResponse } from './core';

// Block API functions
export const blockApi = {
  // Get all blocks with pagination
  async getBlocks(page: number = 1): Promise<PaginatedResponse<Block>> {
    const response = await fetch(`${API_BASE_URL}/blocks?page=${page}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Block>>(response);
  },

  // Get a single block by ID
  async getBlock(id: string): Promise<Block> {
    const response = await fetch(`${API_BASE_URL}/blocks/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Block>(response);
  },

  // Create a new block
  async createBlock(data: BlockFormData): Promise<Block> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('block_name', data.block_name);
    formData.append('location', data.location);
    formData.append('manager_name', data.manager_name);
    formData.append('manager_contact', data.manager_contact);
    formData.append('remarks', data.remarks);
    
    // Append file if present
    if (data.block_attachment) {
      formData.append('block_attachment', data.block_attachment);
    }

    const response = await fetch(`${API_BASE_URL}/blocks`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Block>(response);
  },

  // Update an existing block
  async updateBlock(id: string, data: BlockFormData): Promise<Block> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all form fields
    formData.append('block_name', data.block_name);
    formData.append('location', data.location);
    formData.append('manager_name', data.manager_name);
    formData.append('manager_contact', data.manager_contact);
    formData.append('remarks', data.remarks);
    
    // Append file if present
    if (data.block_attachment) {
      formData.append('block_attachment', data.block_attachment);
    }

    const response = await fetch(`${API_BASE_URL}/blocks/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    return handleResponse<Block>(response);
  },

  // Delete a block
  async deleteBlock(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/blocks/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
};
