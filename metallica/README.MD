# Smart Railway Network Designer

offline-first architecture.

## Features

- **Vue 3 Composition API** with TypeScript
- **PWA Support** with offline capabilities
- **Advanced State Management** with Pinia and undo/redo
- **Enterprise Data Grid** with AG Grid
- **Interactive Diagrams** with GoJS
- **Offline-First Architecture** with IndexedDB
- **Command Palette** for power users
- **Real-time Collaboration** ready
- **Comprehensive Testing** setup

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0 or pnpm >= 7.0.0 (recommended)
- Modern browser with ES2020+ support

## Quick Start

### 1. Create Project Structure

```bash
# Create project directory
mkdir smart-railway-network-designer
cd smart-railway-network-designer

# Initialize project
npm init -y
git init
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install vue@^3.4.15 vue-router@^4.2.5 pinia@^2.1.7

# Build tools
npm install -D @vitejs/plugin-vue@^5.0.3 vite@^5.0.12 vue-tsc@^1.8.27 typescript@^5.3.3

# UI libraries
npm install element-plus@^2.5.6 @element-plus/icons-vue@^2.3.1

# Grid and diagramming
npm install ag-grid-vue3@^31.0.3 ag-grid-community@^31.0.3 ag-grid-enterprise@^31.0.3
npm install gojs@^3.0.2

# Utilities
npm install axios@^1.6.7 @vueuse/core@^10.7.2 pinia-plugin-persistedstate@^3.2.1
npm install @iconify/vue@^4.1.1 idb@^7.1.1 fuse.js@^7.0.0 dayjs@^1.11.10 lodash-es@^4.17.21

# Form validation
npm install vee-validate@^4.12.5 yup@^1.4.0

# PWA
npm install -D vite-plugin-pwa@^0.17.5 workbox-window@^7.0.0

# Tailwind CSS
npm install -D tailwindcss@^3.4.1 autoprefixer@^10.4.17 postcss@^8.4.33

# Auto-imports
npm install -D unplugin-auto-import@^0.17.5 unplugin-vue-components@^0.26.0

# Testing
npm install -D vitest@^1.2.2 @vitest/ui@^1.2.2 @vitest/coverage-v8@^1.2.2 @vue/test-utils@^2.4.4 jsdom@^24.0.0

# Linting and formatting
npm install -D eslint@^8.56.0 @typescript-eslint/eslint-plugin@^6.19.1 @typescript-eslint/parser@^6.19.1 eslint-plugin-vue@^9.20.1 prettier@^3.2.5

# TypeScript types
npm install -D @types/lodash-es@^4.17.12 @types/node
```

### 3. Create Configuration Files

#### package.json (update scripts)

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "format": "prettier --write .",
    "type-check": "vue-tsc --noEmit"
  }
}
```

#### vite.config.ts

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
      "@views": resolve(__dirname, "src/views"),
      "@stores": resolve(__dirname, "src/stores"),
      "@services": resolve(__dirname, "src/services"),
      "@composables": resolve(__dirname, "src/composables"),
      "@types": resolve(__dirname, "src/types"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
});
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable",
      "ES6",
      "ES2015",
      "ES2017",
      "ES2018"
    ],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@views/*": ["src/views/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@composables/*": ["src/composables/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    },
    "types": ["vite/client", "node", "vue/ref-macros-global"]
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "src/**/*.d.ts",
    "src/vite-env.d.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
```

#### .eslintrc.cjs

```javascript
/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript",
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "prefer-const": "warn",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
  },
};
```

#### .prettierrc

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
```

### 4. Create Project Structure

```bash
mkdir -p src/{components/{common,grid,diagram,layout},views,stores,services,composables,workers,types,utils,assets/styles,router}
mkdir -p public tests/{components,utils} docs
```

### 5. Create Core Files

#### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Advanced PWA for designing smart railway networks"
    />
    <meta name="theme-color" content="#3b82f6" />
    <title>Smart Railway Network Designer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />
/// <reference types="vue/ref-macros-global" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_COLLABORATION: string;
  readonly VITE_GOJS_LICENSE_KEY: string;
  readonly VITE_AG_GRID_LICENSE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean;

declare global {
  interface Window {
    __PINIA_STORES__?: Record<string, any>;
  }
}
```

#### src/main.ts

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

// Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// Tailwind CSS
import "./assets/styles/main.css";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);

app.mount("#app");
```

#### src/App.vue

```vue
<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50 transition-colors duration-200">
    <AppLayout>
      <RouterView />
    </AppLayout>
  </div>
</template>
```

#### src/router/index.ts

```typescript
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue"),
    meta: {
      title: "Dashboard",
      icon: "mdi:home",
      showInNav: true,
      keepAlive: false,
    },
  },
  {
    path: "/grid",
    name: "Grid",
    component: () => import("@/views/Grid.vue"),
    meta: {
      title: "Data Grid",
      icon: "mdi:table",
      showInNav: true,
      keepAlive: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

export const getNavigationRoutes = () => {
  return routes.filter((route) => route.meta?.showInNav === true);
};
```

#### src/assets/styles/main.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors;
  }
}
```

### 6. Create Store Files

#### src/stores/ui-basic.ts

```typescript
import { defineStore } from "pinia";

export const useUIStore = defineStore("ui", {
  state: () => ({
    isDarkMode: false,
    isLoading: false,
    sidebarCollapsed: false,
  }),

  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  },
});
```

#### src/stores/railway-basic.ts

```typescript
import { defineStore } from "pinia";

interface RailwayState {
  currentNetwork: any;
  networks: any[];
  selectedNodes: string[];
  selectedConnections: string[];
}

export const useRailwayStore = defineStore("railway", {
  state: (): RailwayState => ({
    currentNetwork: null,
    networks: [],
    selectedNodes: [],
    selectedConnections: [],
  }),

  actions: {
    loadNetworks() {
      console.log("Loading networks...");
    },

    selectNodes(nodeIds: string[]) {
      this.selectedNodes = nodeIds;
    },

    selectConnections(connectionIds: string[]) {
      this.selectedConnections = connectionIds;
    },
  },
});
```

#### src/stores/index.ts

```typescript
export { useRailwayStore } from "./railway-basic";
export { useUIStore } from "./ui-basic";
```

### 7. Create Layout Components

#### src/components/layout/AppLayout.vue

```vue
<script setup lang="ts">
import { useUIStore } from "@/stores/ui-basic";
import { getNavigationRoutes } from "@/router";

const uiStore = useUIStore();
const navigationRoutes = getNavigationRoutes();
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Railway Designer</h1>
            </div>
            <div class="ml-6 flex space-x-8">
              <RouterLink
                v-for="route in navigationRoutes"
                :key="route.name"
                :to="route.path"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                active-class="border-b-2 border-blue-500 text-gray-900"
              >
                {{ route.meta?.title }}
              </RouterLink>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <button
              @click="uiStore.toggleDarkMode()"
              class="p-2 rounded-md hover:bg-gray-100"
              :title="
                uiStore.isDarkMode
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              "
            >
              {{ uiStore.isDarkMode ? "☀️" : "🌙" }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <slot />
    </main>
  </div>
</template>
```

### 8. Create View Components

#### src/views/Home.vue

```vue
<script setup lang="ts">
import { useRailwayStore } from "@/stores/railway-basic";
import { useUIStore } from "@/stores/ui-basic";

const railwayStore = useRailwayStore();
const uiStore = useUIStore();
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1
          class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
        >
          Smart Railway Network Designer
        </h1>
        <p
          class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
        >
          Advanced PWA for designing and managing smart railway networks.
        </p>
        <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <RouterLink to="/grid" class="btn-primary"> Get Started </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### src/views/Grid.vue

```vue
<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Data Grid</h1>
    <p>Grid view will be implemented here.</p>
  </div>
</template>
```

### 9. Create Environment Files

#### .env.example

```bash
# API Configuration
VITE_API_BASE_URL=https://api.railway.com
VITE_WS_URL=wss://api.railway.com/ws

# Application
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_COLLABORATION=false

# Licenses
VITE_GOJS_LICENSE_KEY=your_gojs_license_key_here
VITE_AG_GRID_LICENSE_KEY=your_ag_grid_license_key_here
```

### 10. Create .gitignore

```gitignore
# Dependencies
node_modules
dist
dist-ssr
*.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Test coverage
coverage
*.lcov

# Auto-generated files
auto-imports.d.ts
components.d.ts
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:ui
npm run test:coverage

# Code quality
npm run lint
npm run format
npm run type-check
```

## Common Issues and Solutions

### TypeScript Errors

- Ensure all dependencies are installed
- Run `npm run type-check` to identify issues
- Check that path aliases are correctly configured

### Build Issues

- Clear cache: `rm -rf node_modules/.vite && rm -rf dist`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Import Resolution Issues

- Verify file paths and aliases in `vite.config.ts`
- Use relative imports as fallback if aliases fail

## Project Structure

```
smart-railway-network-designer/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable components
│   ├── views/            # Page components
│   ├── stores/           # Pinia stores
│   ├── services/         # API services
│   ├── composables/      # Vue composables
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utility functions
│   ├── assets/           # Styles and assets
│   └── router/           # Vue Router config
├── tests/                # Test files
├── docs/                 # Documentation
└── ...config files
```

## Next Steps

1. Implement the full store architecture with advanced features
2. Add AG Grid integration for data management
3. Integrate GoJS for interactive diagrams
4. Set up PWA features and offline support
5. Add comprehensive testing
6. Configure CI/CD pipeline
