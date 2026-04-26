export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
