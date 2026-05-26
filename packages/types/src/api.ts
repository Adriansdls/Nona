export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  error: null
}

export interface CaseFilters {
  type?: string
  status?: string
  municipality?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}
