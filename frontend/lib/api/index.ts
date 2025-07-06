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
  PaymentType
} from './types';

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
