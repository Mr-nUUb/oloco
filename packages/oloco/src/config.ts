import type { CurvePoint, FanProfilePoint, RgbData } from './lib/interfaces'
import {
  FanPorts,
  FanProfiles,
  LogLevels,
  RgbModes,
  RgbSpeeds,
  TempModes,
  TempPorts,
} from './lib/iterables'
import type { FanPort, FanProfileName, LogLevel, LogTarget, TempMode, TempPort } from './lib/types'
import Conf from 'conf'

type FanConfig = {
  name: string
  enabled: boolean
  warning: number
  tempSources: TempPort[]
  tempMode: TempMode
  activeProfile: FanProfileName
  customProfile: string
  responseCurve: CurvePoint[]
}

type FlowConfig = {
  name: string
  enabled: boolean
  warning: number
  signalsPerLiter: number
}

type LevelConfig = {
  name: string
  enabled: boolean
  warning: boolean
}

type TempConfig = {
  name: string
  enabled: boolean
  warning: number
  offset: number
}

type AppConfig = {
  fans: FanConfigByPort
  flow: FlowConfig
  level: LevelConfig
  rgb: RgbData
  daemon: DaemonConfig
  temps: TempConfigByPort
  profiles: { [key: string]: FanProfilePoint[] }
  readTimeout: number
}

type FanConfigByPort = { [key in FanPort]: FanConfig }

type TempConfigByPort = { [key in TempPort]: TempConfig }

export type DaemonConfig = {
  logTarget: LogTarget
  logLevel: LogLevel
  logThreshold: number
  interval: number
}

export const Config = new Conf<AppConfig>({
  accessPropertiesByDotNotation: true,
  schema: {
    fans: {
      additionalProperties: false,
      patternProperties: {
        '^F[1-6]$': {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: FanProfiles.slice(),
              type: 'string',
            },
            customProfile: {
              type: 'string',
            },
            enabled: {
              type: 'boolean',
            },
            name: {
              type: 'string',
            },
            responseCurve: {
              items: {
                additionalProperties: false,
                properties: {
                  rpm: {
                    type: 'number',
                  },
                  pwm: {
                    type: 'number',
                  },
                },
                required: ['pwm', 'rpm'],
                type: 'object',
              },
              type: 'array',
            },
            tempSources: {
              items: {
                enum: TempPorts.slice(),
                type: 'string',
              },
              type: 'array',
            },
            tempMode: {
              enum: TempModes.slice(),
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: [
            'name',
            'enabled',
            'warning',
            'tempSources',
            'tempMode',
            'activeProfile',
            'customProfile',
            'responseCurve',
          ],
          type: 'object',
        },
      },
      required: FanPorts.slice(),
      minProperties: 6,
      maxProperties: 6,
      type: 'object',
    },
    flow: {
      additionalProperties: false,
      properties: {
        enabled: {
          type: 'boolean',
        },
        name: {
          type: 'string',
        },
        signalsPerLiter: {
          type: 'number',
        },
        warning: {
          type: 'number',
        },
      },
      required: ['name', 'enabled', 'warning', 'signalsPerLiter'],
      type: 'object',
    },
    level: {
      additionalProperties: false,
      properties: {
        enabled: {
          type: 'boolean',
        },
        name: {
          type: 'string',
        },
        warning: {
          type: 'boolean',
        },
      },
      required: ['name', 'enabled', 'warning'],
      type: 'object',
    },
    rgb: {
      additionalProperties: false,
      properties: {
        color: {
          additionalProperties: false,
          properties: {
            blue: {
              type: 'number',
            },
            green: {
              type: 'number',
            },
            red: {
              type: 'number',
            },
          },
          required: ['red', 'green', 'blue'],
          type: 'object',
        },
        mode: {
          enum: RgbModes.slice(),
          type: 'string',
        },
        speed: {
          enum: RgbSpeeds.slice(),
          type: 'string',
        },
      },
      required: ['color', 'mode', 'speed'],
      type: 'object',
    },
    daemon: {
      additionalProperties: false,
      properties: {
        interval: {
          type: 'number',
        },
        logLevel: {
          enum: LogLevels.slice(),
          type: 'string',
        },
        logTarget: {
          const: 'terminal',
          type: 'string',
        },
        logThreshold: {
          type: 'number',
        },
      },
      required: ['interval', 'logLevel', 'logTarget', 'logThreshold'],
      type: 'object',
    },
    temps: {
      additionalProperties: false,
      patternProperties: {
        '^T[1-3]$': {
          additionalProperties: false,
          properties: {
            enabled: {
              type: 'boolean',
            },
            name: {
              type: 'string',
            },
            offset: {
              type: 'number',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'offset'],
          type: 'object',
        },
      },
      required: TempPorts.slice(),
      minProperties: 3,
      maxProperties: 3,
      type: 'object',
    },
    profiles: {
      additionalProperties: false,
      patternProperties: {
        '...': {
          items: {
            additionalProperties: false,
            properties: {
              temp: {
                type: 'number',
              },
              pwm: {
                type: 'number',
              },
            },
            required: ['temp', 'pwm'],
            type: 'object',
          },
          type: 'array',
        },
      },
      type: 'object',
      minProperties: 0,
      maxProperties: 10,
    },
    readTimeout: {
      type: 'number',
    },
  },
  defaults: {
    fans: FanPorts.reduce(
      (conf, port) => ({
        ...conf,
        [port]: {
          name: port,
          enabled: true,
          warning: 500,
          tempSources: ['T1'],
          tempMode: 'maximum',
          activeProfile: port === 'F6' ? 'custom' : 'AirBalanced',
          customProfile: port === 'F6' ? 'Pump' : '',
          responseCurve: [],
        },
      }),
      {} as FanConfigByPort,
    ),
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
    rgb: {
      mode: 'SpectrumWave',
      speed: 'Normal',
      color: {
        red: 0,
        green: 0,
        blue: 0,
      },
    },
    daemon: {
      interval: 1000,
      logLevel: 'info',
      logTarget: 'terminal',
      logThreshold: 5,
    },
    temps: TempPorts.reduce(
      (conf, port) => ({
        ...conf,
        [port]: {
          name: port,
          enabled: true,
          warning: 50,
          offset: 0,
        },
      }),
      {} as TempConfigByPort,
    ),
    profiles: {
      Pump: [
        {
          temp: 0,
          pwm: 80,
        },
        {
          temp: 60,
          pwm: 80,
        },
        {
          temp: 70,
          pwm: 90,
        },
        {
          temp: 80,
          pwm: 100,
        },
        {
          temp: 100,
          pwm: 100,
        },
      ],
    },
    readTimeout: 100,
  },
})
