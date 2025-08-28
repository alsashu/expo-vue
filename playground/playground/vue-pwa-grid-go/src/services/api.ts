import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Item, CreateItemRequest, UpdateItemRequest, User, Category, LoginRequest, LoginResponse } from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api', // This will be proxied to JSON Server
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Items API
  async getItems(): Promise<Item[]> {
    const response = await this.api.get('/items');
    return response.data;
  }

  async getItem(id: number | string): Promise<Item> {
    const response = await this.api.get(`/items/${id}`);
    return response.data;
  }

  async createItem(item: CreateItemRequest): Promise<Item> {
    console.log(`🔍 [ApiService] Creating new item:`, item);
    try {
      const response = await this.api.post('/items', {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        position: { x: 0, y: 0 },
      });
      console.log(`🔍 [ApiService] Item created successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`🔍 [ApiService] Failed to create item:`, error);
      throw error;
    }
  }

  async updateItem(id: number | string, item: Partial<CreateItemRequest>): Promise<Item> {
    console.log(`🔍 [ApiService] Updating item ${id}:`, item);
    console.log(`🔍 [ApiService] Request URL: /items/${id}`);
    console.log(`🔍 [ApiService] Request payload:`, { ...item, updatedAt: new Date().toISOString() });
    
    try {
      const response = await this.api.patch(`/items/${id}`, {
        ...item,
        updatedAt: new Date().toISOString(),
      });
      console.log(`🔍 [ApiService] Item ${id} updated successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`🔍 [ApiService] Failed to update item ${id}:`, error);
      console.error(`🔍 [ApiService] Error response:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      if (error.response?.status === 404) {
        console.warn(`🔍 [ApiService] Item ${id} not found on server`);
      } else if (error.response?.status === 500) {
        console.error(`🔍 [ApiService] Server error occurred`);
      } else if (!error.response) {
        console.error(`🔍 [ApiService] Network error - no response received`);
      }
      
      throw error;
    }
  }

  async deleteItem(id: number | string): Promise<void> {
    await this.api.delete(`/items/${id}`);
  }

  // Categories API
  async getCategories(): Promise<Category[]> {
    const response = await this.api.get('/categories');
    return response.data;
  }

  // Users API
  async getUsers(): Promise<User[]> {
    const response = await this.api.get('/users');
    return response.data;
  }

  // Authentication API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    const response = await this.api.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/items');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
