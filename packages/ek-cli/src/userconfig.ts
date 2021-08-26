import { FanPort, LightData, TempPort } from '@ek-loop-connect/ek-lib'
import { FanProfileName, FanProfilePoint, LogLevel, LogTarget } from './common'
import os from 'os'
import path from 'path'
import balanced from './res/balanced.json'

export const configFilePath = path.resolve(os.homedir(), '.config/ek-loop-connect/cli/config.json')

export interface UserConfig {
  fans: {
    [key in FanPort]: {
      name: string
      enabled: boolean
      warning: number
      tempSource: TempPort
      activeProfile: FanProfileName
      customProfile: FanProfilePoint[]
    }
  }
  sensors: {
    temps: {
      [key in TempPort]: {
        name: string
        enabled: boolean
        warning: number
        offset: number
      }
    }
    flow: {
      name: string
      enabled: boolean
      warning: number
      signalsPerLiter: number
    }
    level: {
      name: string
      enabled: boolean
      warning: boolean
    }
  }
  lights: LightData
  logger: {
    target: LogTarget
    level: LogLevel
  }
}

export const userConfigTemplate: UserConfig = {
  fans: {
    fan1: {
      name: 'F1',
      enabled: true,
      warning: 500,
      tempSource: 'temp1',
      activeProfile: 'balanced',
      customProfile: balanced,
    },
    fan2: {
      name: 'F2',
      enabled: true,
      warning: 500,
      tempSource: 'temp1',
      activeProfile: 'balanced',
      customProfile: balanced,
    },
    fan3: {
      name: 'F3',
      enabled: true,
      warning: 500,
      tempSource: 'temp1',
      activeProfile: 'balanced',
      customProfile: balanced,
    },
    fan4: {
      name: 'F4',
      enabled: true,
      warning: 500,
      tempSource: 'temp1',
      activeProfile: 'balanced',
      customProfile: balanced,
    },
    fan5: {
      name: 'F5',
      enabled: true,
      warning: 500,
      tempSource: 'temp1',
      activeProfile: 'balanced',
      customProfile: balanced,
    },
    fan6: {
      name: 'F6',
      enabled: true,
      warning: 500,
      tempSource: 'temp1',
      activeProfile: 'balanced',
      customProfile: balanced,
    },
  },
  sensors: {
    temps: {
      temp1: {
        name: 'T1',
        enabled: true,
        warning: 50,
        offset: 0,
      },
      temp2: {
        name: 'T2',
        enabled: true,
        warning: 50,
        offset: 0,
      },
      temp3: {
        name: 'T3',
        enabled: true,
        warning: 50,
        offset: 0,
      },
    },
    flow: {
      name: 'FLO',
      enabled: true,
      warning: 100,
      signalsPerLiter: 80,
    },
    level: {
      name: 'LVL',
      enabled: true,
      warning: true,
    },
  },
  lights: {
    mode: 'spectrumWave',
    speed: 'normal',
    color: {
      red: 0,
      green: 0,
      blue: 0,
    },
  },
  logger: {
    target: 'terminal',
    level: 'info',
  },
}
