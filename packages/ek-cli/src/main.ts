import yargs from 'yargs/yargs'

yargs(process.argv.slice(2))
  .scriptName('ek-connect-cli')
  //.usage('Usage: $0 <command>')
  .commandDir('commands', { extensions: ['js', 'ts'] })
  .demandCommand()
  .alias('h', 'help')
  .alias('v', 'version')
  .help().argv
