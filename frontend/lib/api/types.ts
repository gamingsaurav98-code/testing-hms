export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}
