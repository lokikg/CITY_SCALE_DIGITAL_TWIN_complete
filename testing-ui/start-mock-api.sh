#!/bin/bash

# Start the mock API for local development when real services aren't available

echo "Starting the mock API server for testing UI..."
echo "NOTE: This is for development only. For real testing, set REACT_APP_MOCK_API=false in .env"
echo "      and ensure your actual backend, MQTT broker, database and Grafana are running."

# Check if json-server is installed
if ! command -v json-server &> /dev/null; then
    echo "json-server not found. Installing..."
    npm install -g json-server
fi

# Start the mock API server
cd "$(dirname "$0")/mock-api"
json-server --watch db.json --port 3001 --routes routes.json --middlewares middleware.js

echo "Done!"
