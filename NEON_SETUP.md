# Setting Up Neon PostgreSQL for City IoT Platform

This guide will walk you through setting up a Neon PostgreSQL database for your City IoT platform.

## 1. Create a Neon Account and Project

1. Go to [Neon](https://neon.tech) and sign up for an account
2. Click "Create a project" 
3. Name your project (e.g., "city-iot")
4. Choose a PostgreSQL version (14 or later recommended)
5. Select a region closest to your users
6. Click "Create Project"

## 2. Get Your Connection Credentials

After your project is created, you'll be presented with connection information:

1. Connection string: This is your `DATABASE_URL` that you'll need for your application
   - It will look something like: `postgresql://user:password@endpoint/dbname`
2. Save these credentials securely

## 3. Configure Database Schema

You have two options for setting up your database schema:

### Option A: Run Alembic Migrations from Your Local Machine

1. Update your local `.env` file with the Neon connection string:
   ```
   DATABASE_URL=postgresql://user:password@endpoint/dbname
   ```
2. Run the Alembic migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Option B: Let the Backend Service Handle Migrations

When your application is deployed, it will automatically run migrations if you keep the migration command in the startup script.

## 4. Configure Render Environment Variables

In your Render dashboard:

1. Go to your backend web service
2. Navigate to the "Environment" tab
3. Add the following environment variable:
   - Key: `DATABASE_URL`
   - Value: Your Neon PostgreSQL connection string
4. Click "Save Changes"

## 5. Configure Grafana Connection to Neon

In your Render dashboard:

1. Go to your Grafana web service
2. Navigate to the "Environment" tab
3. Add the following environment variables:
   - `POSTGRES_HOST`: Your Neon PostgreSQL host (without the port)
   - `POSTGRES_USER`: Your Neon PostgreSQL username
   - `POSTGRES_PASSWORD`: Your Neon PostgreSQL password
   - `POSTGRES_DB`: Your Neon PostgreSQL database name
4. Click "Save Changes"

## 6. Benefits of Using Neon

- **More Storage**: 3GB free tier vs Render's 1GB
- **Serverless Architecture**: Auto-scales and handles bursty workloads well
- **Development Features**: Database branching for dev/test environments
- **Performance**: Fast query execution with minimal cold starts
- **Monitoring**: Built-in dashboard for monitoring database performance

## 7. Limitations and Considerations

- **Compute Time Limit**: 20 hours/month on free tier (monitor usage)
- **Connection Pooling**: Consider implementing connection pooling for better performance
- **Auto-scaling**: Be aware of potential costs if usage grows significantly
