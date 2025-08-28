export interface Item {
  id: number | string;
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

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface CreateItemRequest {
  name: string;
  category: string;
  status: Item['status'];
  priority: Item['priority'];
  description: string;
  tags: string[];
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: number | string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AppState {
  isOnline: boolean;
  isDarkMode: boolean;
  pendingSync: Item[];
}

export interface GridState {
  items: Item[];
  loading: boolean;
  selectedItems: Item[];
  filters: {
    category: string;
    status: string;
    priority: string;
    search: string;
  };
}

export interface DiagramState {
  items: Item[];
  selectedNode: any;
  diagramData: any;
}
