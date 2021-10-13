import {
  CurvePoint,
  FanPort,
  fanportIterable,
  RgbData,
  rgbmodeIterable,
  rgbspeedIterable,
  TempPort,
  tempportIterable,
} from '@oloco/oloco'
import {
  fanProfileChoices,
  FanProfileName,
  FanProfilePoint,
  LogLevel,
  LogTarget,
} from './cli.common'
import Conf from 'conf'

type FanConfig = {
  name: string
  enabled: boolean
  warning: number
  tempSource: TempPort
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
  profiles: CustomProfile[]
}

type FanConfigByPort = { [key in FanPort as string]: FanConfig }
type TempConfigByPort = { [key in TempPort as string]: TempConfig }

export type CustomProfile = {
  name: string
  profile: FanProfilePoint[]
}

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
              enum: fanProfileChoices as string[],
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
            tempSource: {
              enum: tempportIterable as string[],
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
            'tempSource',
            'activeProfile',
            'customProfile',
            'responseCurve',
          ],
          type: 'object',
        },
      },
      required: fanportIterable as string[],
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
          enum: rgbmodeIterable as string[],
          type: 'string',
        },
        speed: {
          enum: rgbspeedIterable as string[],
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
          enum: ['debug', 'info', 'warn', 'error'],
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
      required: tempportIterable as string[],
      type: 'object',
    },
    profiles: {
      items: {
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
          },
          profile: {
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
        required: ['name', 'profile'],
        type: 'object',
      },
      type: 'array',
      minItems: 0,
      maxItems: 10,
    },
  },
  defaults: {
    fans: Object.fromEntries(
      fanportIterable.map((port) => [
        port,
        {
          name: port,
          enabled: true,
          warning: 500,
          tempSource: 'T1',
          activeProfile: port === 'F6' ? 'custom' : 'balanced',
          customProfile: port === 'F6' ? 'Pump' : '',
          responseCurve: [],
        },
      ]),
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
    temps: Object.fromEntries(
      tempportIterable.map((port) => [
        port,
        {
          name: port,
          enabled: true,
          warning: 50,
          offset: 0,
        },
      ]),
    ),
    profiles: [
      {
        name: 'Pump',
        profile: [
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
    ],
  },
})
