module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}

process.env = Object.assign(process.env, {
  AWS_REGION: 'mock',
  PRODUCT_TABLE_NAME: 'mock',
  BUCKET_NAME: 'mock',
})
