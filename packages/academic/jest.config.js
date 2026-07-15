module.exports = {
  preset: 'ts-jest',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@repo/academic/(.*)$': '<rootDir>/src/$1',
    '^@repo/academic$': '<rootDir>/src/index.ts',
  },
};
