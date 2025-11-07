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
  occupied_beds?: number;
  created_at: string;
  updated_at?: string;
  block?: Block;
  students?: Student[];
}

export interface RoomFormData {
  room_name: string;
  block_id: string;
  capacity: number;
  room_type: string;
  custom_room_type?: string;
  room_attachment?: File | null;
}

// Hostel interfaces removed as part of single-tenant conversion

export interface Student {
  id: string;
  student_name: string;
  user_id?: string;
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
  is_active: boolean;
  student_image?: string;
  student_citizenship_image?: string;
  registration_form_image?: string;
  // Administrative Details
  student_id?: string;
  is_existing_student?: boolean;
  admission_fee?: string;
  form_fee?: string;
  security_deposit?: string;
  monthly_fee?: string;
  physical_copy_image?: string;
  joining_date?: string;
  // Verification Details
  declaration_agreed?: boolean;
  rules_agreed?: boolean;
  verified_on?: string;
  // Standard fields
  created_at: string;
  updated_at?: string;
  room?: Room;
  due_amount?: number; // Total due amount for the student
}

export interface IncomeType {
  id: string;
  title: string;
  amount?: number;
  student_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Income {
  id: string;
  income_type_id: string;
  amount: number;
  income_date: string;
  title?: string;
  description?: string;
  student_id: string;
  income_attachment?: string;
  payment_type_id: string;
  received_amount?: number;
  due_amount?: number;
  created_at: string;
  updated_at?: string;
  student?: Student;
  incomeType?: IncomeType;
  paymentType?: PaymentType;
  // Backend returns snake_case for relationships
  income_type?: IncomeType;
  payment_type?: PaymentType;
  payment_status?: 'paid' | 'partial';
}

export interface IncomeFormData {
  income_type_id: string;
  amount: number;
  income_date: string;
  title?: string;
  description?: string;
  student_id: string;
  income_attachment?: File | null;
  payment_type_id: string;
  received_amount?: number;
  due_amount?: number;
  payment_status?: 'paid' | 'partial';
}

export interface Attachment {
  id: number;
  name: string;
  path: string;
  type: string;
  created_at: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  contact_number: string;
  address: string;
  description?: string;
  pan_number?: string;
  created_at: string;
  updated_at?: string;
  opening_balance?: number;
  balance_type?: 'due' | 'advance';
  attachments?: Attachment[];
  financials?: any[];
  supplierPayments?: any[];
  transactions?: any[];
  expenses?: any[];
}

export interface SupplierFormData {
  name: string;
  email?: string;
  contact_number: string;
  address: string;
  description?: string;
  pan_number?: string;
  opening_balance?: number;
  balance_type?: 'due' | 'advance';
}
