# IoT Platform Testing UI

This is a dedicated testing application for the City-Scale Digital Twin IoT Platform. It provides comprehensive testing capabilities for all system components (backend, frontend, MQTT, database, and Grafana).

## Features

### Component Testing
- **API Testing**: Test all backend API endpoints with request/response tracking
- **MQTT Testing**: Publish and subscribe to MQTT topics to validate communication
- **Database Testing**: Test database connections and queries
- **Grafana Testing**: Verify Grafana dashboards and metrics
- **Python Test Runner**: Run and monitor Python test scripts directly from the UI

### Integration Testing
- End-to-end workflow testing
- Component interaction validation
- System boundary testing

### Performance Testing
- Load testing
- Stress testing
- Scalability testing
- Response time measurement

### System Monitoring
- Real-time system metrics
- Service status monitoring
- Error and alert tracking
- Log analysis

### Unit Testing
- Component-level test execution
- Test coverage analysis
- Test result visualization

## Architecture

The Testing UI is built as a standalone React application that communicates with all components of the IoT Platform:

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Testing UI    │────▶│   IoT Backend   │
│                 │◀────│                 │
└─────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   MQTT Broker   │     │    Database     │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  IoT Frontend   │     │     Grafana     │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

## Setup and Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- Access to all IoT Platform components (backend, MQTT broker, database, Grafana)

### Installation

1. Navigate to the testing-ui directory
```bash
cd testing-ui
```

2. Install dependencies
```bash
npm install
```

3. Configure for real testing:
   - Edit the `.env` file:
     ```
     # Set to false to test real services instead of mock data
     REACT_APP_MOCK_API=false
     
     # Update these URLs to point to your actual deployed services
     REACT_APP_API_URL=https://your-backend-url.com
     REACT_APP_MQTT_BROKER=mqtt://your-mqtt-broker.com:1883
     REACT_APP_GRAFANA_URL=https://your-grafana-url.com
     
     # Database connection settings (used by backend proxy)
     REACT_APP_DB_HOST=your-db-host.com
     REACT_APP_DB_PORT=5432
     REACT_APP_DB_NAME=your_database
     REACT_APP_DB_USER=db_user
     REACT_APP_DB_PASSWORD=db_password
     ```

4. Start the application
```bash
npm start
```

## Usage

### Development Mode (with Mock Data)

For development and UI testing without real services:

1. Start the mock API (in a separate terminal):
```bash
./start-mock-api.sh
```

2. Start the Testing UI application:
```bash
./start.sh
```
or
```bash
npm start
```

3. Access the Testing UI at http://localhost:3001

### Production Mode (with Real Services)

For testing actual deployed components:

1. Configure your `.env` file to point to real services:
   - Set `REACT_APP_MOCK_API=false`
   - Update URLs for your actual deployed services

2. Ensure all your services are running:
   - Backend API
   - MQTT broker
   - Database
   - Grafana dashboards

3. Start the Testing UI:
```bash
npm start
```

4. Access the Testing UI at http://localhost:3001

5. Use the various testing interfaces to validate each part of your system:
   - API Testing: Test your backend endpoints
   - MQTT Testing: Publish/subscribe to test MQTT communication
   - Database Testing: Run database queries and check results
   - Grafana Testing: Verify your Grafana dashboards
   - Test Runner: Execute Python test scripts directly from the UI
   - System Monitoring: Monitor all services in real-time
   - E2E Testing: Run end-to-end test scenarios

6. View test results and reports to analyze system performance and reliability

## Development

### Project Structure
```
/src
  /components      # UI components for each testing feature
    /ui            # UI component library (buttons, cards, etc.)
    TestRunner.jsx # Python test execution and monitoring
  /services        # API services and utilities
    pythonTestService.js  # Service for running Python tests
  /hooks           # Custom React hooks
  /lib             # Helper functions and utilities
  /config          # Configuration files
```

### Adding New Tests

To add new test suites:
1. Create a new component in the appropriate category
2. Add the test logic to the component
3. Update the navigation to include the new test component
4. Add the component to the routing configuration in App.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
