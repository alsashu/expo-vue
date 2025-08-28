<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
</script>

<template>
  <AppLayout />
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Dark mode styles */
.dark-mode {
  background-color: #1a1a1a !important;
  color: #ffffff !important;
}

.dark-mode .card {
  background-color: #2d2d2d;
  border-color: #444;
}

.dark-mode .form-control,
.dark-mode .form-select {
  background-color: #3a3a3a;
  border-color: #555;
  color: #ffffff;
}

.dark-mode .form-control:focus,
.dark-mode .form-select:focus {
  background-color: #3a3a3a;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.dark-mode .table {
  color: #ffffff;
}

.dark-mode .table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
