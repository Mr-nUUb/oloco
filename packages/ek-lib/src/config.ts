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
import balanced from './res/balanced.json'
import Conf from 'conf'

export type FanConfig = {
  port: FanPort
  name: string
  enabled: boolean
  warning: number
  tempSource: TempPort
  activeProfile: FanProfileName
  customProfile: FanProfilePoint[]
  responseCurve: CurvePoint[]
}
export type FlowConfig = {
  name: string
  enabled: boolean
  warning: number
  signalsPerLiter: number
}
export type LevelConfig = {
  name: string
  enabled: boolean
  warning: boolean
}
export type LogConfig = {
  target: LogTarget
  level: LogLevel
}
export type TempConfig = {
  port: TempPort
  name: string
  enabled: boolean
  warning: number
  offset: number
}
export type AppConfig = {
  fans: FanConfig[]
  flow: FlowConfig
  level: LevelConfig
  rgb: RgbData
  logger: LogConfig
  temps: TempConfig[]
}

export const Config = new Conf<AppConfig>({
  accessPropertiesByDotNotation: true,
  schema: {
    fans: {
      items: {
        additionalProperties: false,
        properties: {
          activeProfile: {
            enum: fanProfileChoices as string[],
            type: 'string',
          },
          customProfile: {
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
          enabled: {
            type: 'boolean',
          },
          name: {
            type: 'string',
          },
          port: {
            enum: fanportIterable as string[],
            readOnly: true,
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
          'port',
          'warning',
          'tempSource',
          'activeProfile',
          'customProfile',
          'responseCurve',
        ],
        type: 'object',
      },
      minItems: 6,
      maxItems: 6,
      type: 'array',
      uniqueItems: true,
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
    logger: {
      additionalProperties: false,
      properties: {
        level: {
          enum: ['debug', 'info', 'warn', 'error'],
          type: 'string',
        },
        target: {
          const: 'terminal',
          type: 'string',
        },
      },
      required: ['target', 'level'],
      type: 'object',
    },
    temps: {
      items: {
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
          port: {
            enum: tempportIterable as string[],
            readOnly: true,
            type: 'string',
          },
          warning: {
            type: 'number',
          },
        },
        required: ['port', 'name', 'enabled', 'warning', 'offset'],
        type: 'object',
      },
      minItems: 3,
      maxItems: 3,
      type: 'array',
      uniqueItems: true,
    },
  },
  defaults: {
    fans: [
      {
        port: 'F1',
        name: 'F1',
        enabled: true,
        warning: 500,
        tempSource: 'T1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: [],
      },
      {
        port: 'F2',
        name: 'F2',
        enabled: true,
        warning: 500,
        tempSource: 'T1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: [],
      },
      {
        port: 'F3',
        name: 'F3',
        enabled: true,
        warning: 500,
        tempSource: 'T1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: [],
      },
      {
        port: 'F4',
        name: 'F4',
        enabled: true,
        warning: 500,
        tempSource: 'T1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: [],
      },
      {
        port: 'F5',
        name: 'F5',
        enabled: true,
        warning: 500,
        tempSource: 'T1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: [],
      },
      {
        port: 'F6',
        name: 'F6',
        enabled: true,
        warning: 500,
        tempSource: 'T1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: [],
      },
    ],
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
    logger: {
      target: 'terminal',
      level: 'info',
    },
    temps: [
      {
        port: 'T1',
        name: 'T1',
        enabled: true,
        warning: 50,
        offset: 0,
      },
      {
        port: 'T2',
        name: 'T2',
        enabled: true,
        warning: 50,
        offset: 0,
      },
      {
        port: 'T3',
        name: 'T3',
        enabled: true,
        warning: 50,
        offset: 0,
      },
    ],
  },
})
