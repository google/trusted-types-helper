/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "jest-puppeteer",
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {
      'tsconfig': {
        esModuleInterop: true,
      }
    }],
  },
  globalSetup: "<rootDir>/test/globalSetup.ts",
  globalTeardown: "<rootDir>/test/globalTeardown.ts",
};