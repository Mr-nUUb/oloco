const { resolve } = require('path')
const ts = require('typescript')

const { DIR_TS_OUT, DIR_TS_ROOT } = require('./constants')

const tsFormatHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

const getTsConfig = (pkg) => ({
  include: [`./${DIR_TS_ROOT}/**/*.ts`],
  exclude: [`./${DIR_TS_ROOT}/**/*.test.ts`, `./${DIR_TS_ROOT}/**/*.test.*.ts`],
  compilerOptions: {
    outDir: resolve(pkg, DIR_TS_OUT),
    rootDir: resolve(pkg, DIR_TS_ROOT),
  },
})

module.exports = {
  tsFormatHost,
  getTsConfig,
}
