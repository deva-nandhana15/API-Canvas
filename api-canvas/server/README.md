# API Canvas Backend

Backend server for the API Canvas platform - A visual platform for designing, testing, and understanding REST APIs.

## Features

- 🗂️ **Project Management**: Full CRUD operations for API projects
- 🧪 **API Testing Proxy**: Forward and test API requests from the frontend
- 💾 **File-based Storage**: Simple JSON file storage for projects
- 🔒 **Type Safety**: Built with TypeScript
- ⚡ **Fast Development**: Hot reload with nodemon

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Storage**: File-based JSON

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file or use the provided `.env.example`:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
DATA_DIR=./data
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```
Check if server is running

### Projects

#### Create Project
```
POST /api/projects
Content-Type: application/json

{
  "name": "My API Project",
  "description": "Optional description",
  "endpoints": [
    {
      "id": "ep1",
      "method": "GET",
      "url": "https://api.example.com/users",
      "description": "Get all users"
    }
  ]
}
```

#### Get All Projects
```
GET /api/projects
```

#### Get Project by ID
```
GET /api/projects/:id
```

#### Update Project
```
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "Updated Project Name",
  "endpoints": [...]
}
```

#### Delete Project
```
DELETE /api/projects/:id
```

### API Testing

#### Execute Test Request
```
POST /api/test
Content-Type: application/json

{
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/users/1",
  "headers": {
    "Authorization": "Bearer token"
  },
  "queryParams": {
    "limit": "10"
  },
  "body": {}
}
```

Response:
```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {...},
  "data": {...},
  "duration": 245
}
```

## Project Structure

```
server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── routes/
│   │   ├── project.routes.ts # Project CRUD routes
│   │   └── test.routes.ts    # API testing routes
│   ├── controllers/
│   │   ├── project.controller.ts
│   │   └── test.controller.ts
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/
│   │   └── storage.ts        # File-based storage utilities
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── data/
│   └── projects/             # JSON storage for projects
├── package.json
├── tsconfig.json
└── .env
```

## Development

### Adding New Features

1. Define types in `src/types/index.ts`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Register routes in `src/index.ts`

### Error Handling

All errors are handled by the global error middleware. Use `AppError` class for custom errors:

```typescript
import { AppError } from './middleware/error.middleware.js';

throw new AppError('Project not found', 404);
```

## Future Enhancements

- [ ] MongoDB integration
- [ ] User authentication (JWT)
- [ ] Rate limiting
- [ ] Request caching
- [ ] WebSocket support for real-time updates
- [ ] Export/Import functionality

## License

ISC
