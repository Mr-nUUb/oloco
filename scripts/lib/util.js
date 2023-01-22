const { spawnSync } = require('child_process')
const { existsSync, readFileSync, readdirSync } = require('fs')
const { EOL } = require('os')
const { basename, resolve } = require('path')
const ts = require('typescript')

const { COLORS, COLOR_RESET, DIR_PACKAGES, DIR_TS_OUT, DIR_TS_ROOT } = require('./constants')

const getLogPrefix = (pkg) => `${getNextColor()}${getPackageName(pkg)}${COLOR_RESET}`

let currentColor = 0
const getNextColor = () => COLORS[currentColor++ % COLORS.length]

const getPackageName = (pkg) => {
  const pkgFile = `${pkg}/package.json`

  if (existsSync(pkgFile)) {
    const { name } = JSON.parse(readFileSync(pkgFile))
    if (name) return name
  }
  if (existsSync(pkg)) {
    return basename(pkg)
  }
  return pkg
}

const getPackages = () =>
  readdirSync(DIR_PACKAGES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `${DIR_PACKAGES}/${d.name}`)

// there must be a better way
const getPackagesTopological = () => {
  const cwd = `${__dirname}/../..`
  const prefix = 'YN0000: '
  const topology = spawnSync(
    'yarn',
    ['workspaces', 'foreach', '--topological', 'exec', 'echo $npm_package_name'],
    { cwd },
  )
    .stdout.toLocaleString()
    .trim()
    .split(EOL)
    .map((s) => s.slice(s.indexOf(prefix) + prefix.length))

  return spawnSync('yarn', ['workspaces', 'list', '--json'], {
    cwd,
  })
    .stdout.toLocaleString()
    .trim()
    .split(EOL) // each line is a JSON object,...
    .map((a) => JSON.parse(a)) // ...parse them
    .filter((a) => a.location !== '.') // remove monorepo package
    .sort((a, b) => topology.indexOf(a.name) - topology.indexOf(b.name)) // sort by topology
    .map((a) => a.location) // extract paths
}

const packageExists = (pkg, prefix) => {
  const result = existsSync(pkg)
  if (!result) console.warn(`${prefix}: not found, skipping...`)
  return result
}

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
  getLogPrefix,
  getPackages,
  getPackagesTopological,
  getTsConfig,
  packageExists,
  tsFormatHost,
}
