import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
})

// Add request logging
api.interceptors.request.use(
  (config) => {
    const offline = localStorage.getItem('offlineMode') === '1'
    if (offline) {
      const method = (config.method || 'get').toUpperCase()
      console.warn('📴 Offline mode: blocking request', method, config.url)
      const error: any = new Error('Offline mode is enabled')
      error.code = 'OFFLINE_MODE'
      return Promise.reject(error)
    }
    console.log('🔄 API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, 'Status:', response.status, 'Data:', response.data)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.config?.url, error.message)
    if (error.code === 'OFFLINE_MODE') {
      // Silently propagate for offline flows
      return Promise.reject(error)
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🚨 Server appears to be offline. Is json-server running on port 3000?')
    }
    return Promise.reject(error)
  }
)