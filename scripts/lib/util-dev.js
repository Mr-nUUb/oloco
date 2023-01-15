const { tmpdir } = require('os')
const { basename, resolve } = require('path')

const {
  constants: { R_OK, W_OK },
  accessSync,
  mkdtempSync,
} = require('fs-extra')
const ts = require('typescript')

const { DIR_TS_OUT, DIR_TS_ROOT } = require('./constants')

const tsFormatHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

const getTsConfig = (pkg) => {
  const tsConfig = {
    include: [`./${DIR_TS_ROOT}/**/*.ts`],
    exclude: [`./${DIR_TS_ROOT}/**/*.test.ts`, `./${DIR_TS_ROOT}/**/*.test.*.ts`],
    compilerOptions: {
      outDir: resolve(pkg, DIR_TS_OUT),
      rootDir: resolve(pkg, DIR_TS_ROOT),
    },
  }

  if (isReadonly(pkg)) {
    const path = `${mkdtempSync(`${tmpdir()}/tsc-`)}`
    const file = `${basename(pkg)}.tsbuildinfo`
    tsConfig['compilerOptions']['tsBuildInfoFile'] = resolve(path, file)
  }

  return tsConfig
}

const isReadonly = (path) => {
  try {
    accessSync(path, R_OK | W_OK)
    return false
  } catch {
    return true
  }
}

module.exports = {
  tsFormatHost,
  getTsConfig,
}
