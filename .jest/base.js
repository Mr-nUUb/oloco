/**
 * This file is referenced by each package in this monorepo,
 * therefore preset (eg. ts-jest) and setupFilesAfterEnv (eg. jest-extended)
 * must be listed as devDependecies in each package.json.
 */

const { resolve } = require('path')

const root = resolve(__dirname, '..')
const ignorePatterns = ['/dist/', '/node_modules/']

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  globalSetup: `${__dirname}/setup.js`,
  cacheDirectory: `${root}/node_modules/.cache/jest`,
  setupFilesAfterEnv: ['jest-extended/all'],
  testPathIgnorePatterns: ignorePatterns,
  coveragePathIgnorePatterns: ignorePatterns,
}
