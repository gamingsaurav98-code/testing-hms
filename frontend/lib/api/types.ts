// Shared interfaces for API models

export interface Block {
  id: string;
  block_name: string;
  location: string;
  manager_name: string;
  manager_contact: string;
  remarks: string;
  block_attachment?: string;
  created_at: string;
  updated_at?: string;
}

export interface BlockFormData {
  block_name: string;
  location: string;
  manager_name: string;
  manager_contact: string;
  remarks: string;
  block_attachment?: File | null;
}

export interface Room {
  id: string;
  room_name: string;
  block_id: string;
  capacity: number;
  status: string;
  room_type: string;
  room_attachment?: string;
  vacant_beds?: number;
  created_at: string;
  updated_at?: string;
  block?: Block;
}

export interface RoomFormData {
  room_name: string;
  block_id: string;
  capacity: number;
  status: string;
  room_type: string;
  room_attachment?: File | null;
}

// Hostel interfaces removed as part of single-tenant conversion
