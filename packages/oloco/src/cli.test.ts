const argvBackup = process.argv
const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

async function runCmd(...args: string[]) {
  process.argv = ['ts-node', 'cli.ts', ...args]
  return require('./cli')
}

describe('cli', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    process.argv = argvBackup
  })

  it('should print help', async () => {
    await runCmd('--help')
    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(0)
  })

  it('should print version', async () => {
    await runCmd('--version')
    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(0)
  })
})
