import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock window.alert
global.alert = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};