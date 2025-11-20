# Integration Guide for City IoT Platform

This document explains how the different components of the City IoT platform are integrated.

## Architecture Overview

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│             │     │               │     │             │
│  Frontend   │────▶│  Backend API  │────▶│  Database   │
│  (Vercel)   │     │  (Render)     │     │  (Render)   │
│             │     │               │     │             │
└─────────────┘     └───────────────┘     └─────────────┘
                           │                     ▲
                           │                     │
                           ▼                     │
                    ┌─────────────┐              │
                    │             │              │
                    │   Grafana   │──────────────┘
                    │  (Render)   │
                    │             │
                    └─────────────┘
```

## Component Integration

### 1. Frontend to Backend Integration

The React frontend application connects to the backend API using axios. The base URL is configured in:
- `.env.development` for local development
- `.env.production` for production deployment on Vercel

All API calls are made through the API service located at `src/services/api.js`. 

Example usage in components:
```javascript
import apiService from '../services/api';

// In a component
async function fetchData() {
  try {
    const response = await apiService.get('/traffic_sensors/all');
    setTrafficData(response.data);
  } catch (error) {
    console.error('Error fetching traffic data:', error);
  }
}
```

### 2. Backend to Database Integration

The FastAPI backend connects to the PostgreSQL database using SQLAlchemy. The connection string is configured through the `DATABASE_URL` environment variable which is injected by Render.

### 3. Grafana Integration

Grafana connects to both:
1. The PostgreSQL database directly for raw data visualization
2. The FastAPI backend's special Grafana endpoints at `/api/grafana/*` for processed data

### 4. Authentication Flow (If Implemented)

If authentication is implemented in the future, the flow would be:
1. User logs in through the frontend
2. Backend validates credentials and issues a JWT token
3. Frontend stores token in local storage
4. All subsequent API requests include the token in the Authorization header
5. Grafana uses API key authentication for its dashboard access

## Environment Variables

### Frontend (Vercel)
- `REACT_APP_API_URL`: The URL of the backend API

### Backend (Render)
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `PORT`: The port on which the server runs

### Grafana (Render)
- `GF_SECURITY_ADMIN_PASSWORD`: Admin password
- `GF_USERS_ALLOW_SIGN_UP`: Whether to allow sign-ups
- `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database connection details

## Troubleshooting

### CORS Issues
If experiencing CORS issues, verify that the frontend URL is correctly added to the `CORS_ORIGINS` environment variable in the backend service.

### Database Connection
If the backend can't connect to the database, check that the `DATABASE_URL` is correctly formatted with `postgresql+asyncpg://` prefix.

### Grafana Dashboard Loading
If Grafana dashboards fail to load data, verify that:
1. The datasource connections are correctly configured
2. The API URL is correct in the datasource configuration
3. The database credentials are correct
