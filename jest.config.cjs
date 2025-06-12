const { defaults: tsjPreset } = require('ts-jest/presets');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  /* 1️⃣  Transpile TS as native ESM */
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        isolatedModules: true,
        module: 'ESNext',
      },
    }],
    // keep any other transforms from the preset
    ...tsjPreset.transform,
  },

  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  /* 2️⃣  Map *only* our own “.js” specifiers back to the TS sources */
  moduleNameMapper: {
    '^(\\.{1,2}/src/.*)\\.js$': '$1.ts',    // ../src/foo.js  -> ../src/foo.ts
    '^\\./config\\.js$': './config.ts',     //  ./config.js   ->  ./config.ts
  },
};
