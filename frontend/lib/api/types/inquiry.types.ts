import { Block } from '../types';

export interface InquirySeater {
  id?: string;
  room_id: string;
  inquiry_id?: string;
  block_id?: string;
  capacity: number;
  created_at?: string;
  updated_at?: string;
  room?: {
    id: string;
    room_name: string;
    capacity: number;
  };
}

export interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email?: string;
  phone: string;
  seater?: number;
  block_id: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  block?: Block;
  inquirySeaters?: InquirySeater[];
  attachments?: Attachment[];
}

export interface InquiryFormData {
  name: string;
  email?: string;
  phone: string;
  block_id: string;
  inquiry_seaters: InquirySeater[];
  description?: string;
  notes?: string;
  attachments?: File[];
}
