/** @type {import('ts-jest').InitialOptionsTsJest} */

const { basename } = require('path')
const baseConfig = require('../../.jest/base')

module.exports = { ...baseConfig, displayName: basename(__dirname) }
