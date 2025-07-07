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
  StudentAmenity
} from './student.api';

// Re-export APIs
export { blockApi } from './block.api';
export { roomApi } from './room.api';
export { incomeApi } from './income.api';
export { studentApi } from './student.api';
export { supplierApi } from './supplier.api';
export { supplierFinancialApi } from './supplier-financial.api';
