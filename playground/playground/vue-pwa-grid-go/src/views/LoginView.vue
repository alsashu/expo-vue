<template>
  <div class="login-container">
    <div class="login-card">
      <div class="text-center mb-4">
        <i class="bi bi-grid-3x3-gap login-icon"></i>
        <h2>Vue PWA Grid Go</h2>
        <p class="text-muted">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errors.username }"
            required
          >
          <div v-if="errors.username" class="invalid-feedback">
            {{ errors.username }}
          </div>
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': errors.password }"
            required
          >
          <div v-if="errors.password" class="invalid-feedback">
            {{ errors.password }}
          </div>
        </div>

        <div class="mb-3">
          <div class="form-check">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="form-check-input"
            >
            <label class="form-check-label" for="remember">
              Remember me
            </label>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <div class="alert alert-info">
          <strong>Demo Credentials:</strong><br>
          Username: <code>admin</code> / Password: <code>admin</code><br>
          Username: <code>user</code> / Password: <code>user</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';

const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const form = reactive({
  username: '',
  password: '',
  remember: false,
});

const errors = reactive({
  username: '',
  password: '',
});

// Mock authentication
const mockUsers = {
  admin: { id: 1, username: 'admin', name: 'Administrator', role: 'admin' },
  user: { id: 2, username: 'user', name: 'Regular User', role: 'user' },
};

const handleLogin = async () => {
  // Reset errors
  errors.username = '';
  errors.password = '';

  // Validate form
  if (!form.username) {
    errors.username = 'Username is required';
    return;
  }

  if (!form.password) {
    errors.password = 'Password is required';
    return;
  }

  loading.value = true;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check credentials
    const user = mockUsers[form.username as keyof typeof mockUsers];
    
    if (user && form.password === form.username) {
      // Login successful
      console.log('🔍 [LoginView] Login successful for user:', user);
      
      // Always save auth token for session persistence
      const authToken = 'mock_token_' + user.username + '_' + Date.now();
      localStorage.setItem('auth_token', authToken);
      console.log('🔍 [LoginView] Auth token saved:', authToken);
      
      // Set current user in app store
      appStore.setCurrentUser(user);
      console.log('🔍 [LoginView] User set in app store');

      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // Login failed
      errors.password = 'Invalid username or password';
    }
  } catch (error) {
    console.error('Login error:', error);
    errors.password = 'An error occurred during login';
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
}

.login-icon {
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.login-form {
  margin-top: 2rem;
}

.form-control {
  border-radius: 0.5rem;
  border: 2px solid #e9ecef;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    transform: none;
    box-shadow: none;
  }
}

.alert {
  border-radius: 0.5rem;
  border: none;
  
  code {
    background-color: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
}

// Dark mode support
.dark-mode {
  .login-card {
    background-color: #2d2d2d;
    color: #ffffff;
  }
  
  .form-control {
    background-color: #3a3a3a;
    border-color: #555;
    color: #ffffff;
    
    &:focus {
      background-color: #3a3a3a;
    }
  }
  
  .form-check-label {
    color: #ffffff;
  }
  
  .alert-info {
    background-color: #1a1a1a;
    color: #ffffff;
    border: 1px solid #444;
    
    code {
      background-color: #333;
      color: #ffffff;
    }
  }
}
</style>
