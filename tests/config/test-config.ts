// Test configuration
export const testConfig = {
  // Environment
  NODE_ENV: 'test',
  TZ: 'UTC',
  DEBUG: false,
  LOG_LEVEL: 'error',

  // Database (if needed)
  DB_URL: 'sqlite://:memory:',
  DB_NAME: 'test_db',

  // API endpoints
  API_BASE_URL: 'http://localhost:3001',
  API_KEY: 'test-key-123',

  // File paths
  TEMP_DIR: '/tmp/test-temp',
  FIXTURES_DIR: './tests/fixtures',

  // Timeouts
  TIMEOUT: 10000,
  RETRY_COUNT: 3,

  // Test data
  TEST_USER: {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
  },

  // Mock data
  MOCK_RESPONSES: {
    success: { status: 'success', data: {} },
    error: { status: 'error', message: 'Test error' },
  },
} as const

// Test utilities
export const testUtils = {
  // Generate test data
  generateTestData: (type: string) => {
    const timestamp = Date.now()
    return {
      id: `test-${type}-${timestamp}`,
      createdAt: new Date(timestamp).toISOString(),
    }
  },

  // Create test file path
  createTestPath: (filename: string) => {
    return `${testConfig.TEMP_DIR}/${filename}`
  },

  // Create test URL
  createTestUrl: (endpoint: string) => {
    return `${testConfig.API_BASE_URL}${endpoint}`
  },
}
