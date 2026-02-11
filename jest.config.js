const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.js'
  },
  modulePathIgnorePatterns: ["<rootDir>/HeyAmara/"],
  testPathIgnorePatterns: [
    "<rootDir>/tests/e2e.test.ts"
  ],
  // E2E tests require serial execution (single worker) to avoid Jest serialization issues
  // Run separately with: npm test -- tests/e2e.test.ts --maxWorkers=1
  maxWorkers: '50%'
};
