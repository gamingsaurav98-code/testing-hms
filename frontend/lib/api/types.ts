// Shared interfaces for API models

// Base interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

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

// Student related interfaces
export interface Student extends BaseEntity {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  contact_number: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  parent_name: string;
  parent_contact: string;
  parent_email?: string;
  parent_occupation?: string;
  parent_address?: string;
  room_id?: string;
  is_active: boolean;
  admission_date: string;
  student_image?: string;
  student_id?: string;
  documents?: StudentDocument[];
  room?: Room;
  check_ins?: CheckInOut[];
  payments?: Payment[];
  complaints?: Complaint[];
}

export interface StudentDocument extends BaseEntity {
  student_id: string;
  document_type: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  document_file?: string;
  is_verified: boolean;
}

// Staff related interfaces
export interface Staff extends BaseEntity {
  id: string;
  staff_name: string;
  email: string;
  contact_number: string;
  date_of_birth?: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  position: string;
  department: string;
  joining_date: string;
  salary: number;
  is_active: boolean;
  staff_image?: string;
  documents?: StaffDocument[];
  check_ins?: StaffCheckIn[];
  salaries?: StaffSalary[];
  leaves?: StaffLeave[];
}

export interface StaffDocument extends BaseEntity {
  staff_id: string;
  document_type: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  document_file?: string;
  is_verified: boolean;
}

export interface StaffCheckIn extends BaseEntity {
  staff_id: string;
  check_in: string;
  check_out?: string;
  status: 'checked_in' | 'checked_out';
  notes?: string;
  staff?: Staff;
}

export interface StaffSalary extends BaseEntity {
  staff_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
  staff?: Staff;
}

export interface StaffLeave extends BaseEntity {
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  staff?: Staff;
}

// Common interfaces
export interface CheckInOut extends BaseEntity {
  student_id: string;
  check_in: string;
  check_out?: string;
  status: 'checked_in' | 'checked_out';
  notes?: string;
  student?: Student;
}

export interface Payment extends BaseEntity {
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  payment_type: 'rent' | 'security' | 'other';
  description?: string;
  receipt_number: string;
  received_by: string;
  student?: Student;
}

export interface Complaint extends BaseEntity {
  student_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  student?: Student;
  assigned_staff?: Staff;
}

// Amenity interfaces
export interface Amenity extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

export interface StudentAmenity extends BaseEntity {
  student_id: string;
  amenity_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'cancelled';
  student?: Student;
  amenity?: Amenity;
}

export interface StaffAmenity extends BaseEntity {
  staff_id: string;
  amenity_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'cancelled';
  staff?: Staff;
  amenity?: Amenity;
}

// Financial interfaces
export interface Expense extends BaseEntity {
  category_id: string;
  amount: number;
  expense_date: string;
  description?: string;
  payment_method: string;
  reference_number?: string;
  attachment_url?: string;
  category?: ExpenseCategory;
}

export interface ExpenseCategory extends BaseEntity {
  name: string;
  description?: string;
  is_active: boolean;
}

// Notification interfaces
export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
}

// Settings interfaces
export interface Setting extends BaseEntity {
  key: string;
  value: string;
  description?: string;
  is_public: boolean;
}

// Audit log interface
export interface AuditLog extends BaseEntity {
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: unknown;
  new_values?: unknown;
  ip_address?: string;
  user_agent?: string;
  user?: Staff | Student;
}

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
  financials?: unknown[];
  supplierPayments?: unknown[];
  transactions?: unknown[];
  expenses?: unknown[];
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
