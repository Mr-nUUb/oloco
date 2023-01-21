const { existsSync, rmSync, unlinkSync } = require('fs-extra')

const { DIR_TS_OUT } = require('./lib/constants')
const { getLogPrefix, getPackages, packageExists } = require('./lib/util')

const rmSyncOptions = { recursive: true, force: true }

const cleanCache = () => rmSync('node_modules/.cache', rmSyncOptions)

const cleanDist = (packages) => {
  packages.forEach((pkg) => {
    const prefix = getLogPrefix(pkg)
    if (!packageExists(pkg, prefix)) return

    console.time(prefix)

    let target = `${pkg}/${DIR_TS_OUT}`
    if (existsSync(target)) rmSync(target, rmSyncOptions)

    target = `${pkg}/tsconfig.tsbuildinfo`
    if (existsSync(target)) unlinkSync(target)

    console.timeEnd(prefix)
  })
}

const cleanModules = () => {
  rmSync('.yarn/cache', rmSyncOptions)
  rmSync('.yarn/unplugged', rmSyncOptions)
  unlinkSync('.yarn/install-state.gz')
  unlinkSync('.pnp.cjs')
  unlinkSync('.pnp.loader.mjs')
}

const cleanReports = () => {
  rmSync('reports', rmSyncOptions)
  rmSync('coverage', rmSyncOptions)
}

const _clean = (target, packages) => {
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

const clean = (target, packages) =>
  _clean(target, packages.length > 0 && target === DIR_TS_OUT ? packages : getPackages())

module.exports = clean

if (require.main === module) process.exitCode = clean(process.argv[2], process.argv.slice(3))
