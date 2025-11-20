# Test Runner Integration

This integration connects the existing Python test suite with the React-based testing UI. It enables running and monitoring tests directly from the UI, providing a user-friendly interface for test execution and result analysis.

## Components

### Backend Components

1. **Test Runner API (`test_runner.py`)**
   - Provides REST API endpoints to execute tests and retrieve results
   - Runs pytest and integration tests as background processes
   - Captures test output and results
   - Parses test summaries for UI display

2. **Modified Backend Tests**
   - `backend_test.py` - Enhanced with command-line arguments for flexibility
   - Tests can now target specific device types or endpoints

### Frontend Components

1. **Python Test Service (`pythonTestService.js`)**
   - Service for connecting to the test runner API
   - Manages test execution requests
   - Polls for test status updates
   - Parses and formats test results

2. **Test Runner UI (`TestRunner.jsx`)**
   - React component for the test runner interface
   - Displays available tests by category
   - Shows real-time test execution status
   - Formats and displays test output with syntax highlighting
   - Summarizes test results

## How It Works

1. **Test Discovery**
   - The UI loads available tests from the `pythonTestService`
   - Tests are categorized as API tests or integration tests

2. **Test Execution**
   - When a user selects a test to run, the UI calls the appropriate service method
   - The service makes an API request to the backend test runner
   - The backend starts the test in a background process

3. **Status Monitoring**
   - The UI polls the backend for test status updates
   - Progress is displayed in real-time
   - Test output is streamed to the UI as it becomes available

4. **Result Visualization**
   - Test results are parsed and displayed in a readable format
   - Success/failure indicators show test status
   - Detailed output is available for inspection
   - Test summary statistics are calculated and displayed

## Usage

1. Navigate to the Test Runner page via the navbar or by going to `/test-runner`
2. Select a test category (API Tests or Integration Tests)
3. Click "Run Test" on any individual test or "Run All API Tests"
4. Monitor the progress in the Test Results section
5. Expand result entries to view detailed output and summaries

## Benefits

- **User-friendly Interface**: Makes test execution accessible to non-technical users
- **Centralized Testing**: Provides a single location to run various types of tests
- **Real-time Feedback**: Shows test progress and results as they happen
- **Formatted Output**: Makes test results easier to understand
- **Test Metrics**: Summarizes test success rates and statistics

## Integration Points

- The Test Runner connects to the backend API at `/api/tests/`
- It leverages the existing test code in `test_api.py`, `test_api_sync.py`, and `backend_test.py`
- Results are parsed from pytest output and displayed in the UI
