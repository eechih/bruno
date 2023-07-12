module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}

process.env = Object.assign(process.env, {
  AWS_REGION: 'mock_region',
  BUCKET_NAME: 'mock_bucket_name',
  SETTINGS_TABLE_NAME: 'mock_settings_table_name',
  PRODUCT_TABLE_NAME: 'mock_product_table_name',
  AUTOMATOR_QUEUE_URL: 'mock_automator_queue_url',
  AUTOMATOR_DLQUEUE_URL: 'mock_automator_dlqueue_url',
})
