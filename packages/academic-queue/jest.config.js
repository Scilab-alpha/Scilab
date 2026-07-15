module.exports = {
  preset: 'ts-jest',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  passWithNoTests: true,
};
