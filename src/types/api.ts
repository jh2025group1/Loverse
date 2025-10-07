// API Response types
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}
