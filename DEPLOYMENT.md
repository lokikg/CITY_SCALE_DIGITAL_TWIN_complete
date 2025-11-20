# Deployment Guide for City IoT Platform

This document provides step-by-step instructions for deploying the City IoT platform.

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Neon account (https://neon.tech)

## 1. Deploying PostgreSQL Database on Neon

1. Log in to your Neon account
2. Click "Create a project"
3. Configure your project:
   - Name: `city-iot`
   - PostgreSQL Version: 15 (or latest)
   - Region: Choose closest to your users
4. Click "Create Project"
5. Save the connection details provided by Neon:
   - Connection string (DATABASE_URL)
   - Host
   - Database
   - Username
   - Password

For detailed instructions, see the [Neon Setup Guide](./NEON_SETUP.md).

## 2. Deploying Backend API on Render

1. Push your code to a GitHub repository
2. Log in to your Render account
3. Click "New +" and select "Blueprint" (or "Web Service" if not using render.yaml)
4. Connect your GitHub repository
5. If using the Blueprint approach:
   - Render will detect the render.yaml file and set up services accordingly
   - You'll need to manually add the Neon DATABASE_URL as an environment variable
6. If using the Web Service approach:
   - Name: `city-iot-api`
   - Environment: Python
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && alembic upgrade head && uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Add environment variables:
     - `DATABASE_URL`: Use the Connection String from your Neon PostgreSQL project
     - `CORS_ORIGINS`: Set to your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
7. Click "Create Web Service"
8. Wait for the deployment to complete
9. Note the deployed URL (e.g., `https://city-iot-api.onrender.com`)

## 3. Deploying Frontend on Vercel

1. Update the .env.production file with your backend API URL:
   ```
   REACT_APP_API_URL=https://your-render-api-url.onrender.com/api
   ```

2. Push your code to GitHub
3. Log in to Vercel
4. Click "New Project"
5. Import your GitHub repository
6. Configure the project:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
7. Add environment variables:
   - `REACT_APP_API_URL`: Set to your backend API URL
8. Click "Deploy"
9. Wait for the deployment to complete
10. Note the deployed URL (e.g., `https://your-app.vercel.app`)

## 4. Deploying Grafana on Render

1. If using the Blueprint approach with render.yaml:
   - Grafana will be deployed automatically with the backend API
   - You'll need to manually add the Neon PostgreSQL connection details as environment variables
2. If deploying separately:
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Environment: Docker
   - Root Directory: `grafana`
   - Add environment variables:
     - `GF_SECURITY_ADMIN_PASSWORD`: Choose a secure password
     - `GF_USERS_ALLOW_SIGN_UP`: `false`
     - `GF_INSTALL_PLUGINS`: `grafana-clock-panel,grafana-simple-json-datasource,grafana-postgresql-datasource`
     - `POSTGRES_HOST`: Neon PostgreSQL host
     - `POSTGRES_USER`: Neon PostgreSQL username
     - `POSTGRES_PASSWORD`: Neon PostgreSQL password
     - `POSTGRES_DB`: Neon PostgreSQL database name
     - `API_URL`: Backend API URL
   - Click "Create Web Service"
3. Wait for the deployment to complete
4. Note the deployed URL (e.g., `https://city-iot-grafana.onrender.com`)

## 5. Final Configuration

1. Update the backend CORS settings:
   - Add your Vercel frontend URL to the `CORS_ORIGINS` environment variable
   - Format: `https://your-app.vercel.app,http://localhost:3000`

2. Update the Grafana datasource configuration:
   - Log in to Grafana
   - Navigate to Configuration > Data Sources
   - Update the API URL to point to your deployed backend API
   - Update the PostgreSQL connection details if necessary

3. Test the integration:
   - Visit your frontend URL
   - Verify that data is loading correctly
   - Check that Grafana dashboards are displaying data

## Troubleshooting

### Backend Deployment Issues

- Check Render logs for any errors
- Verify that the Neon DATABASE_URL is correctly formatted and accessible
- Ensure alembic migrations run successfully
- Check if your IP is allowed in Neon's connection policies

### Frontend Deployment Issues

- Check Vercel build logs for any errors
- Verify that the API URL is correctly set in environment variables
- Test API connectivity from the browser console

### Grafana Deployment Issues

- Check Render logs for any Grafana startup errors
- Verify datasource connections in Grafana UI
- Check that Neon PostgreSQL credentials are correctly set
- Check that dashboards are correctly provisioned

## Maintenance

- Monitor your Neon PostgreSQL compute hours usage (free tier has 20 hours/month)
- Consider implementing connection pooling for better performance with Neon
- Regularly backup your PostgreSQL database (Neon offers point-in-time recovery)
- Monitor your Render and Vercel usage and adjust plans as needed
- Keep dependencies updated to ensure security and performance
