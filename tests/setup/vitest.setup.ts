import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.test if it exists (for unit tests)
const envTestPath = resolve(process.cwd(), '.env.test');
if (existsSync(envTestPath)) {
  config({ path: envTestPath });
  console.log('✅ Loaded .env.test for unit tests');
} else {
  console.warn('⚠️  .env.test not found, using fallback mock values');
  // Fallback mock values for when .env.test doesn't exist
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
  process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-anon-key';
  process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'test-openrouter-key';
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
