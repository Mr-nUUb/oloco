// colors optimized for dark backgrounds
const COLORS = [
  // '\x1b[0;30m', // black
  '\x1b[0;31m', // red
  '\x1b[0;32m', // green
  '\x1b[0;33m', // yellow
  '\x1b[0;34m', // blue
  '\x1b[0;35m', // magenta
  '\x1b[0;36m', // cyan
  // '\x1b[0;37m', // light grey
  // '\x1b[1;30m', // dark grey
  '\x1b[1;31m', // light red
  '\x1b[1;32m', // light green
  '\x1b[1;33m', // light yellow
  '\x1b[1;34m', // light blue
  '\x1b[1;35m', // light magenta
  '\x1b[1;36m', // light cyan
  // '\x1b[1;37m', // white
]
const COLOR_RESET = '\x1b[0m'

const DIR_PACKAGES = 'packages'
const DIR_TS_OUT = 'dist'
const DIR_TS_ROOT = 'src'

const LIB_NAME = '@mr-nuub/template-lib'

module.exports = {
  COLORS,
  COLOR_RESET,
  DIR_PACKAGES,
  DIR_TS_OUT,
  DIR_TS_ROOT,
  LIB_NAME,
}
