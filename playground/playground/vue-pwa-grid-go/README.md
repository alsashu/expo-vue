# Vue PWA Grid Go - Learning Project

A comprehensive Vue.js 3 learning project that demonstrates modern web development concepts including PWA capabilities, data grids, diagrams, and offline-first architecture.

## 🚀 Features

### Core Technologies
- **Vue.js 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Pinia** - State management for Vue 3
- **Vue Router** - Client-side routing
- **Bootstrap 5** - UI framework with SCSS support
- **ag-Grid** - Advanced data grid component
- **GoJS** - Interactive diagramming library
- **Axios** - HTTP client for API requests
- **JSON Server** - Mock REST API backend

### Key Features
- **PWA Support** - Installable and works offline
- **Offline-First Architecture** - Uses IndexedDB for local storage
- **Real-time Sync** - Syncs data when online
- **Dark/Light Mode** - Theme switching
- **Responsive Design** - Works on all devices
- **Authentication** - Mock login system
- **Data Visualization** - Interactive diagrams and charts
- **CRUD Operations** - Full item management

## 📋 Project Structure

```
vue-pwa-grid-go/
├── src/
│   ├── components/
│   │   └── AppLayout.vue          # Main layout component
│   ├── stores/
│   │   ├── app.ts                 # Global app state
│   │   └── items.ts               # Items management state
│   ├── services/
│   │   ├── api.ts                 # API service with Axios
│   │   └── storage.ts             # IndexedDB storage service
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── views/
│   │   ├── DashboardView.vue      # Dashboard with statistics
│   │   ├── ItemsView.vue          # ag-Grid data management
│   │   ├── DiagramView.vue        # GoJS diagram visualization
│   │   └── LoginView.vue          # Authentication page
│   ├── router/
│   │   └── index.ts               # Vue Router configuration
│   ├── assets/
│   │   └── main.css               # Global styles
│   ├── App.vue                    # Root component
│   └── main.ts                    # Application entry point
├── db.json                        # JSON Server database
├── vite.config.ts                 # Vite configuration with PWA
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 20.19.0 or higher
- npm or yarn package manager

### 1. Clone and Install Dependencies
```bash
# Navigate to the project directory
cd vue-pwa-grid-go

# Install dependencies
npm install
```

### 2. Start Development Servers

#### Option A: Start Both Frontend and Backend
```bash
# Start both Vue dev server and JSON Server
npm run dev:full
```

#### Option B: Start Separately
```bash
# Terminal 1: Start Vue development server
npm run dev

# Terminal 2: Start JSON Server (API backend)
npm run json-server
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **API Endpoints**: http://localhost:3001/items

## 🔐 Authentication

The application includes a mock authentication system:

### Demo Credentials
- **Admin User**: `admin` / `admin`
- **Regular User**: `user` / `user`

## 📱 PWA Features

### Installation
- The app is installable as a PWA
- Works offline with IndexedDB storage
- Automatic data synchronization when online

### Offline Functionality
- Items are cached locally using IndexedDB
- CRUD operations work offline
- Changes are queued and synced when connection is restored

## 🎯 Key Pages

### Dashboard (`/dashboard`)
- Overview statistics and charts
- Recent items list
- Quick navigation to other sections

### Items Management (`/items`)
- **ag-Grid** implementation with:
  - Sorting and filtering
  - Search functionality
  - CRUD operations
  - Responsive design
  - Export capabilities

### Diagram Visualization (`/diagram`)
- **GoJS** interactive diagrams
- Multiple layout options
- Node linking based on categories/tags
- Export to SVG
- Interactive node selection

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start Vue dev server only
npm run dev:full         # Start both frontend and backend
npm run preview          # Preview production build

# Building
npm run build            # Build for production
npm run build:pwa        # Build with PWA features

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Database
npm run json-server      # Start JSON Server
npm run db:seed          # Seed database (if implemented)
```

## 🗄️ API Endpoints

The JSON Server provides the following endpoints:

- `GET    /api/items` - Get all items
- `GET    /api/items/:id` - Get item by ID
- `POST   /api/items` - Create new item
- `PUT    /api/items/:id` - Update item
- `PATCH  /api/items/:id` - Partially update item
- `DELETE /api/items/:id` - Delete item

## 🎨 Styling

- **Bootstrap 5** for layout and components
- **SCSS** for custom styling
- **Bootstrap Icons** for icons
- **Dark/Light mode** toggle
- **Responsive design** for all screen sizes

## 📊 Data Structure

### Item Object
```typescript
interface Item {
  id: number;
  name: string;
  category: string;
  status: 'Available' | 'In Progress' | 'Completed' | 'Pending' | 'Planning';
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
  description: string;
  tags: string[];
  position: { x: number; y: number };
}
```

## 🔄 State Management

### Pinia Stores
- **App Store**: Global application state, authentication, theme
- **Items Store**: Items data, filtering, CRUD operations

### Data Flow
1. Components dispatch actions to stores
2. Stores manage state and API calls
3. Offline changes are queued in IndexedDB
4. Synchronization occurs when online

## 🚀 Deployment

### Build for Production
```bash
npm run build:pwa
```

### PWA Features in Production
- Service worker for offline support
- App manifest for installation
- Workbox for caching strategies

## 🧪 Testing

The project includes:
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 Learning Objectives

This project demonstrates:

### Vue.js 3 Concepts
- Composition API
- TypeScript integration
- Component composition
- Reactive state management

### Modern Web Development
- PWA implementation
- Offline-first architecture
- Service workers
- IndexedDB usage

### Data Visualization
- Grid components (ag-Grid)
- Diagram libraries (GoJS)
- Interactive charts and graphs

### State Management
- Pinia stores
- Type-safe state
- Persistence strategies

### API Integration
- RESTful APIs
- HTTP client usage
- Error handling
- Request/response interceptors

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 3001 are available
2. **PWA not working**: Clear browser cache and service workers
3. **GoJS not loading**: Check if GoJS license is properly configured
4. **IndexedDB errors**: Clear browser storage in DevTools

### Development Tips

1. Use Vue DevTools for debugging
2. Check browser console for errors
3. Use Network tab to monitor API calls
4. Use Application tab to inspect IndexedDB

## 📄 License

This project is created for educational purposes. Feel free to use and modify as needed.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- ag-Grid for the powerful data grid
- GoJS for the diagramming library
- Bootstrap team for the UI framework
