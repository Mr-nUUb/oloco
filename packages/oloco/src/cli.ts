#!/usr/bin/env node

import yargs from 'yargs/yargs'
import detectTSNode from 'detect-ts-node'

yargs(process.argv.slice(2))
  .scriptName('oloco')
  //.usage('Usage: $0 <command>')
  .commandDir('commands', {
    extensions: [detectTSNode ? 'ts' : 'js'],
  })
  .demandCommand()
  .alias('h', 'help')
  .alias('v', 'version')
  .help().argv
