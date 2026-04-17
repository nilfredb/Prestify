module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native|expo(nent)?|@expo(nent)?/.*|expo-router|@expo/.*|@unimodules/.*|unimodules|sentry-expo|native-base|phosphor-react-native|moti)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
};