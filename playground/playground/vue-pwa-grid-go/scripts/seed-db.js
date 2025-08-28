import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample data for seeding
const sampleData = {
  "items": [
    {
      "id": 1,
      "name": "Laptop Computer",
      "category": "Electronics",
      "status": "Available",
      "priority": "High",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "description": "High-performance laptop for development work",
      "tags": ["computer", "development", "tech"],
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": 2,
      "name": "Project Management Tool",
      "category": "Software",
      "status": "In Progress",
      "priority": "Medium",
      "createdAt": "2024-01-10T09:15:00Z",
      "updatedAt": "2024-01-16T14:20:00Z",
      "description": "Internal project management application",
      "tags": ["software", "management", "internal"],
      "position": { "x": 300, "y": 150 }
    },
    {
      "id": 3,
      "name": "Design System",
      "category": "Design",
      "status": "Completed",
      "priority": "Low",
      "createdAt": "2024-01-05T11:45:00Z",
      "updatedAt": "2024-01-20T16:30:00Z",
      "description": "Comprehensive design system for the company",
      "tags": ["design", "system", "ui"],
      "position": { "x": 500, "y": 200 }
    },
    {
      "id": 4,
      "name": "Database Migration",
      "category": "Backend",
      "status": "Pending",
      "priority": "High",
      "createdAt": "2024-01-12T13:20:00Z",
      "updatedAt": "2024-01-18T10:45:00Z",
      "description": "Migration of legacy database to new schema",
      "tags": ["database", "migration", "backend"],
      "position": { "x": 200, "y": 300 }
    },
    {
      "id": 5,
      "name": "Mobile App",
      "category": "Mobile",
      "status": "Planning",
      "priority": "Medium",
      "createdAt": "2024-01-08T15:30:00Z",
      "updatedAt": "2024-01-14T12:10:00Z",
      "description": "Cross-platform mobile application",
      "tags": ["mobile", "app", "cross-platform"],
      "position": { "x": 400, "y": 350 }
    }
  ],
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "name": "Administrator"
    },
    {
      "id": 2,
      "username": "user",
      "email": "user@example.com",
      "role": "user",
      "name": "Regular User"
    }
  ],
  "categories": [
    { "id": 1, "name": "Electronics", "color": "#007bff" },
    { "id": 2, "name": "Software", "color": "#28a745" },
    { "id": 3, "name": "Design", "color": "#ffc107" },
    { "id": 4, "name": "Backend", "color": "#dc3545" },
    { "id": 5, "name": "Mobile", "color": "#6f42c1" }
  ]
};

// Write to db.json
const dbPath = path.join(__dirname, '..', 'db.json');

try {
  fs.writeFileSync(dbPath, JSON.stringify(sampleData, null, 2));
  console.log('✅ Database seeded successfully!');
  console.log(`📁 Data written to: ${dbPath}`);
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
  process.exit(1);
}
