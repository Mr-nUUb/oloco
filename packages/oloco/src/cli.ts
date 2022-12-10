#!/usr/bin/env node

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

yargs(hideBin(process.argv))
  .scriptName('oloco')
  //.usage('Usage: $0 <command>')
  .commandDir('commands', { extensions: ['ts', 'js'] })
  .demandCommand()
  .alias('h', 'help')
  .alias('v', 'version')
  .option('k', {
    alias: 'skipValidation',
    default: false,
    describe: 'Skip packet validation.',
    type: 'boolean',
  })
  .help().argv
