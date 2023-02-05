#!/usr/bin/env node

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import detectTSNode from 'detect-ts-node'

yargs(hideBin(process.argv))
  .scriptName('oloco')
  //.usage('Usage: $0 <command>')
  .commandDir('commands', {
    extensions: [detectTSNode ? 'ts' : 'js'],
  })
  .demandCommand()
  .alias('h', 'help')
  .alias('v', 'version')
  .option('k', {
    alias: 'skipValidation',
    default: false,
    describe: 'Skip packet validation.',
    type: 'boolean',
  })
  .completion()
  .help().argv
