<template>
  <div class="api-test">
    <div class="test-panel">
      <h3>🔧 API Connection Test</h3>
      <p><strong>API URL:</strong> {{ apiUrl }}</p>
      <p><strong>Status:</strong>
        <span :class="connectionStatus.class">{{ connectionStatus.text }}</span>
      </p>

      <button @click="testConnection" :disabled="testing" class="btn">
        {{ testing ? '🔄 Testing...' : '🧪 Test API' }}
      </button>

      <button @click="createMockData" :disabled="testing" class="btn btn-secondary">
        📦 Create Test Data
      </button>

      <div v-if="testResult" class="test-result">
        <h4>Test Result:</h4>
        <pre>{{ testResult }}</pre>
      </div>

      <div v-if="error" class="error">
        <h4>Error:</h4>
        <p>{{ error }}</p>
        <div class="error-help">
          <h5>Common Solutions:</h5>
          <ul>
            <li>Make sure json-server is running: <code>npm run api</code></li>
            <li>Check if port 3000 is available</li>
            <li>Verify db.json file exists</li>
            <li>Try restarting the API server</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/services/api'

const testing = ref(false)
const testResult = ref<any>(null)
const error = ref<string | null>(null)
const isConnected = ref<boolean | null>(null)

const apiUrl = 'http://localhost:3000'

const connectionStatus = computed(() => {
  if (isConnected.value === null) return { text: 'Unknown', class: 'status-unknown' }
  if (isConnected.value) return { text: '🟢 Connected', class: 'status-connected' }
  return { text: '🔴 Disconnected', class: 'status-error' }
})

const testConnection = async () => {
  testing.value = true
  error.value = null
  testResult.value = null

  try {
    console.log('Testing API connection...')
    const response = await api.get('/items')

    isConnected.value = true
    testResult.value = {
      status: 'SUCCESS',
      items: response.data,
      count: response.data.length
    }
  } catch (err: any) {
    isConnected.value = false
    error.value = err.message || 'Connection failed'
    testResult.value = {
      status: 'FAILED',
      error: err.message,
      code: err.code
    }
  } finally {
    testing.value = false
  }
}

const createMockData = async () => {
  testing.value = true
  error.value = null

  try {
    const mockItem = {
      id: Date.now(),
      name: `Test Item ${Date.now()}`,
      category: 'Electronics',
      quantity: 10,
      unitPrice: 99.99,
      status: 'in-stock',
      updatedAt: new Date().toISOString()
    }

    const response = await api.post('/items', mockItem)
    testResult.value = {
      status: 'ITEM_CREATED',
      item: response.data
    }
    isConnected.value = true
  } catch (err: any) {
    error.value = `Failed to create test item: ${err.message}`
    isConnected.value = false
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.api-test {
  margin: 1rem 0;
}

.test-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.status-connected {
  color: #28a745;
  font-weight: bold;
}

.status-error {
  color: #dc3545;
  font-weight: bold;
}

.status-unknown {
  color: #6c757d;
}

.test-result {
  background: #e9ecef;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.test-result pre {
  white-space: pre-wrap;
  font-size: 0.9rem;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.error-help {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f5c6cb;
}

.error-help ul {
  margin-left: 1rem;
}

.error-help code {
  background: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

button+button {
  margin-left: 0.5rem;
}
</style>