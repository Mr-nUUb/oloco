const ts = require('typescript')

const { getLogPrefix, getPackagesTopological, packageExists } = require('./lib/util')
const { getTsConfig, tsFormatHost } = require('./lib/util-dev')

function _tsc(target, packages) {
  let exitCode = 0

  if (target !== 'compile' && target !== 'watch') {
    console.error(`Invalid tsc target: ${target}`)
    process.exit(1)
  }

  console.info(`Starting compilers in "${target}" mode...`)
  console.time('Overall')

  packages.forEach((pkg) => {
    const prefix = getLogPrefix(pkg)

    if (!packageExists(pkg, prefix)) return

    console.time(prefix)

    const buildMessage = (diagnostic) =>
      `${prefix}: ${ts.formatDiagnostic(diagnostic, tsFormatHost).trim()}`

    function reportDiagnostic(diagnostic) {
      console.error(buildMessage(diagnostic))
      exitCode = 1
    }

    function reportWatchStatusChanged(diagnostic) {
      console.info(buildMessage(diagnostic))
    }

    const tsConfig = getTsConfig(pkg)
    const compilerHost = ts.createWatchCompilerHost(
      `${pkg}/tsconfig.json`,
      tsConfig.compilerOptions,
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      reportDiagnostic,
      reportWatchStatusChanged,
    )

    const origCreateProgram = compilerHost.createProgram
    compilerHost.createProgram = (
      _,
      options,
      host,
      oldProgram,
      configFileParsingDiagnostics,
      projectReferences,
    ) =>
      origCreateProgram(
        compilerHost.readDirectory(`${pkg}`, undefined, tsConfig.exclude, tsConfig.include),
        options,
        host,
        oldProgram,
        configFileParsingDiagnostics,
        projectReferences,
      )

    const program = ts.createWatchProgram(compilerHost)

    if (target === 'compile') program.close()
    console.timeEnd(prefix)
  })

  console.info('Started all compilers!')
  console.info('--------------------')
  console.timeEnd('Overall')
  if (target === 'watch') console.info('--------------------')

  return exitCode
}

function tsc(target, packages) {
  return _tsc(target, packages.length > 0 ? packages : getPackagesTopological())
}

module.exports = tsc

if (require.main === module) process.exitCode = tsc(process.argv[2], process.argv.slice(3))
