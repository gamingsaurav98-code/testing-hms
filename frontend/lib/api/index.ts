// Re-export core components
export { ApiError, type PaginatedResponse } from './core';

// Re-export types
export type { 
  Block,
  BlockFormData,
  Room,
  RoomFormData,
  Student,
  Income,
  IncomeFormData,
  IncomeType,
  PaymentType,
  Supplier,
  SupplierFormData
} from './types';

// Import supplier financial API types
export type {
  SupplierFinancial,
  SupplierFinancialFormData
} from './supplier-financial.api';

// Import student API types
export type {
  StudentWithAmenities,
  StudentFormData,
  StudentAmenity,
  StudentFinancial,
  StudentFinancialFormData
} from './student.api';

// Import notice API types
export type {
  Notice,
  NoticeFormData,
  StudentForNotice,
  StaffForNotice,
  BlockForNotice
} from './notice.api';

// Import inquiry API types
export type {
  Inquiry,
  InquiryFormData,
  InquirySeater,
  Attachment as InquiryAttachment
} from './types/inquiry.types';

// Import expense API types
export type {
  Expense,
  ExpenseFormData,
  ExpenseCategory,
  ExpenseCategoryFormData,
  Purchase,
  PurchaseFormData
} from './types/expense.types';

// Import salary API types
export type {
  Salary,
  Staff,
  SalaryStatistics,
  CreateSalaryRequest,
  UpdateSalaryRequest,
  SalaryFilters
} from './salary.api';

// Re-export APIs
export { authApi, tokenStorage, getAuthHeaders } from './auth.api';
export { blockApi } from './block.api';
export { roomApi } from './room.api';
export { incomeApi } from './income.api';
export { studentApi, studentFinancialApi } from './student.api';
export { supplierApi } from './supplier.api';
export { supplierFinancialApi } from './supplier-financial.api';
export { noticeApi } from './notice.api';
export { inquiryApi } from './inquiry.api';
export { expenseApi, expenseCategoryApi } from './expense.api';
export { SalaryApi, StaffApi } from './salary.api';
