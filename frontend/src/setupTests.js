// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.REACT_APP_BACKEND_URL = 'http://localhost:5000';

// Global test setup
beforeEach(() => {
  // Reset console methods if they were mocked
  if (console.error.mockRestore) {
    console.error.mockRestore();
  }
  if (console.warn.mockRestore) {
    console.warn.mockRestore();
  }
});