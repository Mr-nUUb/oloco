const { spawn, spawnSync } = require('child_process')

const { DIR_TS_OUT, DIR_TS_ROOT } = require('./lib/constants')
const {
  getLogPrefix,
  getPackagesTopological,
  getPackagesWithoutLib,
  handleStdio,
  isTypescript,
  packageExists,
} = require('./lib/util')

let exitCode = 0
let isDevmode
let isWatchmode
let isSync

const _isSync = (action) => {
  const result = process.env['NODE_START_SYNC']
    ? process.env['NODE_START_SYNC'].toLowerCase() === 'true'
    : action.startsWith('init') || action.startsWith('wipe')
  if (result) console.info('Starting processes in sync mode, collecting exit codes!')
  else console.info('Starting processes in async mode, NOT collecting exit codes!')
  return result
}

const _getExecutable = (isTs) => {
  if (isWatchmode) return 'ts-node-dev'
  if (isTs && isDevmode) return 'ts-node'
  return 'node'
}

const _getTarget = (isTs, action) => {
  if (isTs) {
    if (isDevmode || isWatchmode) return `${DIR_TS_ROOT}/${action}.ts`
    return `${DIR_TS_OUT}/${action}.js`
  }
  return `${action}.js`
}

const _getEnv = (isTs) => {
  if (isTs && (isDevmode || isWatchmode)) return `${process.env['NODE_ENV']}-ts`
  return process.env['NODE_ENV']
}

const _getPackages = () => (isWatchmode ? getPackagesTopological() : getPackagesWithoutLib())

function _start(action, pkg, instance) {
  const prefix = getLogPrefix(pkg, instance)

  if (!packageExists(pkg, prefix)) return

  const isTs = isTypescript(pkg, action)
  const executable = _getExecutable(isTs)
  const target = _getTarget(isTs, action)
  const env = { ...process.env, NODE_ENV: _getEnv(isTs), TZ: 'UTC' }

  if (instance && !env['NODE_APP_INSTANCE']) env['NODE_APP_INSTANCE'] = instance

  if (isSync) {
    const proc = spawnSync(executable, [target], { cwd: pkg, stdio: 'pipe', env })
    handleStdio(proc.stdout, console.info, prefix)
    handleStdio(proc.stderr, console.error, prefix)
    if (proc.status !== 0) exitCode = 1
  } else {
    const isLib = pkg.includes('sws-lib')
    const proc = isLib
      ? spawn('node', ['scripts/tsc.js', 'watch', pkg], { stdio: 'pipe' })
      : spawn(executable, [target], { cwd: pkg, stdio: 'pipe', env })
    proc.stdout.on('data', (buffer) => {
      handleStdio(buffer, console.info, prefix)
    })
    proc.stderr.on('data', (buffer) => {
      handleStdio(buffer, console.error, prefix)
    })
    if (isLib) {
      console.info(
        prefix,
        'Sleeping for 10s to avoid race conditions (sws-lib is compiling in background)...',
      )

      // we can't use async/await here...
      spawnSync('sleep', ['10'])
    }
  }
}

function start(action, packages) {
  const mode = (process.env['NODE_START_MODE'] || '').toLowerCase()
  isDevmode = mode === 'dev' || mode === 'develop'
  isWatchmode = mode === 'watch'
  isSync = isWatchmode ? false : _isSync(action)

  const pkgs = packages.length > 0 ? packages : _getPackages()

  pkgs.forEach((pkg) => {
    _start(action, pkg)
  })

  return exitCode
}

module.exports = start

if (require.main === module) process.exitCode = start(process.argv[2], process.argv.slice(3))
