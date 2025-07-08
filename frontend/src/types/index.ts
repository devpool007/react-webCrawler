export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CrawlResult {
  id: number;
  url_id: number;
  title: string;
  html_version: string;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  h4_count: number;
  h5_count: number;
  h6_count: number;
  internal_links: number;
  external_links: number;
  inaccessible_links: number;
  has_login_form: boolean;
  created_at: string;
  updated_at: string;
  broken_links?: BrokenLink[];
}

export interface BrokenLink {
  id: number;
  result_id: number;
  url: string;
  status_code: number;
  error_message: string;
  created_at: string;
}

export interface URLItem {
  id: number;
  user_id: number;
  url: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  result?: CrawlResult;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  message: string;
  data?: unknown;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface URLRequest {
  url: string;
}

export interface BulkRequest {
  ids: number[];
}

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
}

export interface TableFilters {
  [key: string]: string;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}
