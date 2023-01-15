const { existsSync, rmSync, unlinkSync } = require('fs-extra')

const { DIR_TS_OUT } = require('./lib/constants')
const { getLogPrefix, getPackages, packageExists } = require('./lib/util')

const rmSyncOptions = { recursive: true, force: true }

function cleanCache() {
  rmSync('node_modules/.cache', rmSyncOptions)
}

function cleanDist(packages) {
  const target = DIR_TS_OUT
  packages.forEach((pkg) => {
    const prefix = getLogPrefix(pkg)

    if (!packageExists(pkg, prefix)) return

    console.time(prefix)

    const targetPath = `${pkg}/${target}`
    if (existsSync(targetPath)) {
      rmSync(targetPath, rmSyncOptions)
    }
    if (target == DIR_TS_OUT) {
      const tsBuildinfo = `${pkg}/tsconfig.tsbuildinfo`
      if (existsSync(tsBuildinfo)) unlinkSync(tsBuildinfo)
    }

    console.timeEnd(prefix)
  })
}

function cleanModules() {
  rmSync('.yarn/cache', rmSyncOptions)
  rmSync('.yarn/unplugged', rmSyncOptions)
  unlinkSync('.yarn/install-state.gz')
  unlinkSync('.pnp.cjs')
  unlinkSync('.pnp.loader.mjs')
}

function cleanReports() {
  rmSync('reports', rmSyncOptions)
  rmSync('coverage', rmSyncOptions)
}

function _clean(target, packages) {
  console.time('Overall')
  console.info(`Cleaning "${target}"...`)

  switch (target) {
    case DIR_TS_OUT:
      cleanDist(packages)
      break
    case 'cache':
      cleanCache()
      break
    case 'modules':
      cleanModules()
      break
    case 'reports':
      cleanReports()
      break
    default:
      console.error(`Invalid clean target: ${target}`)
      process.exit(1)
  }

  console.info('--------------------')
  console.timeEnd('Overall')

  return 0
}

function clean(target, packages) {
  return _clean(target, packages.length > 0 && target === DIR_TS_OUT ? packages : getPackages())
}

module.exports = clean

if (require.main === module) process.exitCode = clean(process.argv[2], process.argv.slice(3))
