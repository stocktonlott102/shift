/**
 * Jest Setup File
 *
 * This file runs once before all tests.
 * Use it to configure testing environment and import global test utilities.
 */

import '@testing-library/jest-dom';

/**
 * @testing-library/jest-dom adds custom jest matchers for asserting on DOM nodes.
 *
 * Available matchers:
 * - toBeDisabled()
 * - toBeEnabled()
 * - toBeEmpty()
 * - toBeInTheDocument()
 * - toBeVisible()
 * - toBeChecked()
 * - toHaveAttribute()
 * - toHaveClass()
 * - toHaveTextContent()
 * - toHaveValue()
 *
 * Full list: https://github.com/testing-library/jest-dom#custom-matchers
 */

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_PRICE_ID = 'price_test_mock';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

/**
 * Global test utilities and mocks can be added here
 * Example: Mock window.matchMedia, IntersectionObserver, etc.
 */

// Mock window.matchMedia (used by some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console errors in tests (optional - comment out if you want to see them)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
