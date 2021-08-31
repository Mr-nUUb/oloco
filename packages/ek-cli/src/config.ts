import { FanData, FanPort, LightData, TempPort } from '@ek-loop-connect/ek-lib'
import {
  fanportIterable,
  fanProfileChoices,
  FanProfileName,
  FanProfilePoint,
  lightModeChoices,
  lightSpeedChoices,
  LogLevel,
  LogTarget,
  tempportIterable,
} from './common'
import balanced from './res/balanced.json'
import Conf from 'conf'

const emptyCurve: FanData[] = [
  { pwm: 0, rpm: 0 },
  { pwm: 10, rpm: 0 },
  { pwm: 20, rpm: 0 },
  { pwm: 30, rpm: 0 },
  { pwm: 40, rpm: 0 },
  { pwm: 50, rpm: 0 },
  { pwm: 60, rpm: 0 },
  { pwm: 70, rpm: 0 },
  { pwm: 80, rpm: 0 },
  { pwm: 90, rpm: 0 },
  { pwm: 100, rpm: 0 },
]

export type FanConfig = {
  id: FanPort
  name: string
  enabled: boolean
  warning: number
  tempSource: TempPort
  activeProfile: FanProfileName
  customProfile: FanProfilePoint[]
  responseCurve: FanData[]
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
  id: TempPort
  name: string
  enabled: boolean
  warning: number
  offset: number
}
export type AppConfig = {
  fans: FanConfig[]
  flow: FlowConfig
  level: LevelConfig
  lights: LightData
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
          id: {
            enum: fanportIterable as string[],
            readOnly: true,
            type: 'string',
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
          'id',
          'warning',
          'tempSource',
          'activeProfile',
          'customProfile',
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
    lights: {
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
          enum: lightModeChoices as string[],
          type: 'string',
        },
        speed: {
          enum: lightSpeedChoices as string[],
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
          id: {
            enum: tempportIterable as string[],
            readOnly: true,
            type: 'string',
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
      minItems: 3,
      maxItems: 3,
      type: 'array',
      uniqueItems: true,
    },
  },
  defaults: {
    fans: [
      {
        id: 'fan1',
        name: 'F1',
        enabled: true,
        warning: 500,
        tempSource: 'temp1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: emptyCurve,
      },
      {
        id: 'fan2',
        name: 'F2',
        enabled: true,
        warning: 500,
        tempSource: 'temp1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: emptyCurve,
      },
      {
        id: 'fan3',
        name: 'F3',
        enabled: true,
        warning: 500,
        tempSource: 'temp1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: emptyCurve,
      },
      {
        id: 'fan4',
        name: 'F4',
        enabled: true,
        warning: 500,
        tempSource: 'temp1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: emptyCurve,
      },
      {
        id: 'fan5',
        name: 'F5',
        enabled: true,
        warning: 500,
        tempSource: 'temp1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: emptyCurve,
      },
      {
        id: 'fan6',
        name: 'F6',
        enabled: true,
        warning: 500,
        tempSource: 'temp1',
        activeProfile: 'balanced',
        customProfile: balanced,
        responseCurve: emptyCurve,
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
    temps: [
      {
        id: 'temp1',
        name: 'T1',
        enabled: true,
        warning: 50,
        offset: 0,
      },
      {
        id: 'temp2',
        name: 'T2',
        enabled: true,
        warning: 50,
        offset: 0,
      },
      {
        id: 'temp3',
        name: 'T3',
        enabled: true,
        warning: 50,
        offset: 0,
      },
    ],
  },
})
