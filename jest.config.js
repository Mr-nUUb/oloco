/** @type {import('ts-jest').InitialOptionsTsJest} */

const { resolve } = require('path')

const projectRoot = resolve(__dirname)
const coverageDirectory = `${projectRoot}/coverage`
const outputDirectory = `${projectRoot}/reports`

module.exports = {
  collectCoverage: true,
  coverageDirectory,
  coverageReporters: ['json', 'cobertura', 'lcov', 'text'],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory }],
    [
      'jest-stare',
      { resultDir: outputDirectory, coverageLink: `${coverageDirectory}/lcov-report/index.html` },
    ],
  ],
  projects: ['<rootDir>/packages/*'],
}
