import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  URLItem,
  URLRequest,
  CrawlResult,
  PaginatedResponse,
  SuccessResponse,
  BrokenLink,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8080/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  // URL endpoints
  async getURLs(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<URLItem>> {
    const response: AxiosResponse<PaginatedResponse<URLItem>> = await this.api.get('/urls', { params });
    return response.data;
  }

  async createURL(urlData: URLRequest): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.post('/urls', urlData);
    return response.data;
  }

  async getURL(id: number): Promise<URLItem> {
    const response: AxiosResponse<URLItem> = await this.api.get(`/urls/${id}`);
    return response.data;
  }

  async startCrawling(id: number): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.put(`/urls/${id}/start`);
    return response.data;
  }

  async stopCrawling(id: number): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.put(`/urls/${id}/stop`);
    return response.data;
  }

  async deleteURL(id: number): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.delete(`/urls/${id}`);
    return response.data;
  }

  async getResults(id: number): Promise<CrawlResult> {
    const response: AxiosResponse<CrawlResult> = await this.api.get(`/urls/${id}/results`);
    return response.data;
  }

  async rerunURL(id: number): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.put(`/urls/${id}/rerun`);
    return response.data;
  }

  async getBrokenLinks(resultId: number): Promise<BrokenLink[]> {
    const response: AxiosResponse<BrokenLink[]> = await this.api.get(`/results/${resultId}/broken-links`);
    return response.data;
  }

  // Bulk operations
  async bulkDeleteURLs(ids: number[]): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.post('/bulk/delete', { ids });
    return response.data;
  }

  async bulkRerunURLs(ids: number[]): Promise<SuccessResponse> {
    const response: AxiosResponse<SuccessResponse> = await this.api.post('/bulk/rerun', { ids });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
