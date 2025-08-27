import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useUIStore } from '@stores/ui'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.railway.com'
const API_TIMEOUT = 30000
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// Request queue for offline handling
interface QueuedRequest {
  id: string
  config: AxiosRequestConfig
  resolve: (value: any) => void
  reject: (reason: any) => void
  timestamp: number
  retryCount: number
}

class APIService {
  private instance: AxiosInstance
  private requestQueue: QueuedRequest[] = []
  private isOnline = navigator.onLine
  private activeRequests = new Map<string, AbortController>()

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0'
      }
    })

    this.setupInterceptors()
    this.setupOfflineHandling()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const uiStore = useUIStore()
        
        // Add authentication token
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add correlation ID for tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId()

        // Add request ID for cancellation
        const requestId = this.generateRequestId()
        config.metadata = { requestId }
        
        // Create abort controller for this request
        const abortController = new AbortController()
        config.signal = abortController.signal
        this.activeRequests.set(requestId, abortController)

        // Handle loading states
        if (config.metadata?.showLoading !== false) {
          uiStore.setLoading(true, config.metadata?.loadingMessage)
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request [${requestId}]:`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data
          })
        }

        return config
      },
      (error) => {
        const uiStore = useUIStore()
        uiStore.setLoading(false)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const uiStore = useUIStore()
        const requestId = response.config.metadata?.requestId
        
        // Clean up request tracking
        if (requestId) {
          this.activeRequests.delete(requestId)
        }

        // Handle loading states
        if (response.config.metadata?.showLoading !== false) {
          uiStore.setLoading(false)
        }

        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`✅ API Response [${requestId}]:`, {
            status: response.status,
            data: response.data
          })
        }

        // Handle specific success cases
        if (response.config.metadata?.successMessage) {
          uiStore.showSuccess('Success', response.config.metadata.successMessage)
        }

        return response
      },
      async (error: AxiosError) => {
        const uiStore = useUIStore()
        const requestId = error.config?.metadata?.requestId
        
        // Clean up request tracking
        if (requestId) {
          this.activeRequests.delete(requestId)
        }

        uiStore.setLoading(false)

        // Handle different error types
        if (error.code === 'ERR_CANCELED') {
          // Request was cancelled, don't show error
          return Promise.reject(error)
        }

        if (error.response) {
          // Server responded with error status
          await this.handleServerError(error)
        } else if (error.request) {
          // Network error
          await this.handleNetworkError(error)
        } else {
          // Other errors
          uiStore.showError('Error', 'An unexpected error occurred')
        }

        // Log error in development
        if (import.meta.env.DEV) {
          console.error(`❌ API Error [${requestId}]:`, error)
        }

        return Promise.reject(error)
      }
    )
  }

  private async handleServerError(error: AxiosError) {
    const uiStore = useUIStore()
    const status = error.response?.status
    const data = error.response?.data as any

    switch (status) {
      case 400:
        uiStore.showError('Bad Request', data.message || 'Invalid request data')
        break
      case 401:
        uiStore.showError('Unauthorized', 'Please log in again')
        await this.handleAuthError()
        break
      case 403:
        uiStore.showError('Forbidden', 'You do not have permission to perform this action')
        break
      case 404:
        uiStore.showError('Not Found', 'The requested resource was not found')
        break
      case 409:
        uiStore.showError('Conflict', data.message || 'Resource conflict detected')
        break
      case 422:
        this.handleValidationError(data.errors || data.message)
        break
      case 429:
        uiStore.showWarning('Rate Limited', 'Too many requests. Please try again later.')
        break
      case 500:
        uiStore.showError('Server Error', 'Internal server error. Please try again.')
        break
      case 502:
      case 503:
      case 504:
        uiStore.showError('Service Unavailable', 'Service is temporarily unavailable')
        // Auto-retry for server errors
        await this.retryRequest(error.config!)
        break
      default:
        uiStore.showError('Error', data.message || 'An error occurred')
    }
  }

  private async handleNetworkError(error: AxiosError) {
    const uiStore = useUIStore()
    
    if (!this.isOnline) {
      // Queue request for when online
      this.queueRequest(error.config!)
      uiStore.showWarning('Offline', 'Request queued for when connection is restored')
    } else {
      // Retry network errors
      await this.retryRequest(error.config!)
    }
  }

  private handleValidationError(errors: any) {
    const uiStore = useUIStore()
    
    if (typeof errors === 'string') {
      uiStore.showError('Validation Error', errors)
    } else if (Array.isArray(errors)) {
      errors.forEach(error => {
        uiStore.showError('Validation Error', error.message || error)
      })
    } else if (typeof errors === 'object') {
      Object.entries(errors).forEach(([field, messages]) => {
        const messageArray = Array.isArray(messages) ? messages : [messages]
        messageArray.forEach((message: string) => {
          uiStore.showError(`${field} Error`, message)
        })
      })
    }
  }

  private async handleAuthError() {
    // Clear stored auth token
    this.clearAuthToken()
    
    // Redirect to login or refresh token
    // Implementation depends on your auth strategy
    console.log('Authentication error - redirect to login')
  }

  private async retryRequest(config: AxiosRequestConfig, retryCount = 0): Promise<any> {
    if (retryCount >= RETRY_ATTEMPTS) {
      return Promise.reject(new Error('Max retry attempts reached'))
    }

    // Exponential backoff delay
    const delay = RETRY_DELAY * Math.pow(2, retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      config.metadata = { ...config.metadata, retryCount: retryCount + 1 }
      return await this.instance(config)
    } catch (error) {
      return this.retryRequest(config, retryCount + 1)
    }
  }

  private queueRequest(config: AxiosRequestConfig) {
    const queuedRequest: QueuedRequest = {
      id: this.generateRequestId(),
      config,
      resolve: () => {},
      reject: () => {},
      timestamp: Date.now(),
      retryCount: 0
    }

    this.requestQueue.push(queuedRequest)
    
    // Limit queue size
    if (this.requestQueue.length > 50) {
      this.requestQueue.shift()
    }
  }

  private setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private async processQueue() {
    const uiStore = useUIStore()
    
    if (this.requestQueue.length === 0) return

    uiStore.showInfo('Syncing', `Processing ${this.requestQueue.length} queued requests...`)

    const queue = [...this.requestQueue]
    this.requestQueue = []

    for (const queuedRequest of queue) {
      try {
        const response = await this.instance(queuedRequest.config)
        queuedRequest.resolve(response)
      } catch (error) {
        queuedRequest.reject(error)
      }
    }

    uiStore.showSuccess('Sync Complete', 'All queued requests have been processed')
  }

  // Utility methods
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private clearAuthToken(): void {
    localStorage.removeItem('auth_token')
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRequestId(): string {
    return crypto.randomUUID()
  }

  // Public methods
  public cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId)
    if (controller) {
      controller.abort()
      this.activeRequests.delete(requestId)
    }
  }

  public cancelAllRequests(): void {
    this.activeRequests.forEach(controller => controller.abort())
    this.activeRequests.clear()
  }

  public getQueueSize(): number {
    return this.requestQueue.length
  }

  public clearQueue(): void {
    this.requestQueue = []
  }

  // HTTP methods with enhanced features
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete(url, config)
    return response.data
  }

  // Upload with progress tracking
  async upload<T = any>(
    url: string, 
    data: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await this.instance.post(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
    return response.data
  }

  // Download with progress tracking
  async download(
    url: string, 
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })

    // Auto-download file if filename provided
    if (filename) {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    }

    return response.data
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { 
        timeout: 5000,
        metadata: { showLoading: false }
      })
      return true
    } catch {
      return false
    }
  }

  // Get instance for direct access
  get axios(): AxiosInstance {
    return this.instance
  }
}

// Create and export singleton instance
export const api = new APIService()

// Type augmentation for axios config
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      requestId?: string
      showLoading?: boolean
      loadingMessage?: string
      successMessage?: string
      retryCount?: number
      [key: string]: any
    }
  }
}