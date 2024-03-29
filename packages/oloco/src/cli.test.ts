let argvBackup: string[]
let consoleSpy: jest.SpyInstance
let exitSpy: jest.SpyInstance

async function runCmd(...args: string[]) {
  process.argv = ['ts-node', 'cli.ts', ...args]
  return require('./cli')
}

describe('cli', () => {
  beforeAll(() => {
    argvBackup = process.argv
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    exitSpy = jest.spyOn(process, 'exit').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
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
