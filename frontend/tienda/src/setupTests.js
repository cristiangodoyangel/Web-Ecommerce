// setupTests.js
import '@testing-library/jest-dom';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock de fetch
global.fetch = jest.fn();

// Mock de window.location
delete window.location;
window.location = { 
  href: '',
  assign: jest.fn(),
  reload: jest.fn()
};