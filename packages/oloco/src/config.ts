import {
  FanPorts,
  FanProfiles,
  LogLevels,
  LogModes,
  LogTargets,
  RgbModes,
  RgbSpeeds,
  TempModes,
  TempPorts,
  TimestampFormats,
} from './lib/iterables'
import Conf, { Schema } from 'conf'
import type { AppConfig } from './lib/types'
import { dirname, resolve } from 'node:path'

const pumpSpeedDesired = 80

export const schema: Schema<AppConfig> = {
  fans: {
    additionalProperties: false,
    patternProperties: {
      '^F[1-6]$': {
        additionalProperties: false,
        properties: {
          activeProfile: {
            enum: [...FanProfiles],
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
              enum: [...TempPorts],
              type: 'string',
            },
            type: 'array',
          },
          tempMode: {
            enum: [...TempModes],
            type: 'string',
          },
          warning: {
            type: 'number',
          },
          backOffSpeed: {
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
          'backOffSpeed',
        ],
        type: 'object',
      },
    },
    required: [...FanPorts],
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
      name: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
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
        enum: [...RgbModes],
        type: 'string',
      },
      speed: {
        enum: [...RgbSpeeds],
        type: 'string',
      },
      backOffConfig: {
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
            enum: [...RgbModes],
            type: 'string',
          },
          speed: {
            enum: [...RgbSpeeds],
            type: 'string',
          },
        },
        required: ['color', 'mode', 'speed'],
        type: 'object',
      },
    },
    required: ['color', 'mode', 'speed', 'backOffConfig'],
    type: 'object',
  },
  daemon: {
    additionalProperties: false,
    properties: {
      interval: {
        type: 'number',
      },
      logDelimiter: {
        type: 'string',
      },
      logDirectory: {
        type: 'string',
      },
      logFileRetentionDays: {
        type: 'number',
      },
      logLevel: {
        enum: [...LogLevels],
        type: 'string',
      },
      logMode: {
        enum: [...LogModes],
        type: 'string',
      },
      logTarget: {
        enum: [...LogTargets],
        type: 'string',
      },
      logThreshold: {
        type: 'number',
      },
      timestampFormat: {
        enum: [...TimestampFormats],
        type: 'string',
      },
    },
    required: [
      'interval',
      'logDelimiter',
      'logDirectory',
      'logFileRetentionDays',
      'logLevel',
      'logTarget',
      'logThreshold',
      'timestampFormat',
    ],
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
    required: [...TempPorts],
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
}

export const defaults: Readonly<AppConfig> = {
  fans: FanPorts.reduce(
    (config, port) => ({
      ...config,
      [port]: {
        name: port,
        enabled: true,
        warning: 500,
        backOffSpeed: port === 'F6' ? pumpSpeedDesired : 100,
        tempSources: ['T1'],
        tempMode: 'Maximum',
        activeProfile: port === 'F6' ? 'Custom' : 'AirBalanced',
        customProfile: port === 'F6' ? 'Pump' : '',
        responseCurve: [],
      },
    }),
    {} as AppConfig['fans'],
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
    name: 'All Zones',
    enabled: true,
    mode: 'SpectrumWave',
    speed: 'Normal',
    color: {
      red: 0,
      green: 0,
      blue: 0,
    },
    backOffConfig: {
      mode: 'Static',
      speed: 'Normal',
      color: {
        red: 255,
        green: 0,
        blue: 0,
      },
    },
  },
  daemon: {
    interval: 1000,
    logDelimiter: ', ',
    logDirectory: resolve(dirname(new Conf({ configName: 'dummy' }).path), 'logs'),
    logFileRetentionDays: 30,
    logLevel: 'Info',
    logMode: 'Text',
    logTarget: 'Console',
    logThreshold: 5,
    timestampFormat: 'ISO',
  },
  temps: TempPorts.reduce(
    (config, port) => ({
      ...config,
      [port]: {
        name: port,
        enabled: true,
        warning: 50,
        offset: 0,
      },
    }),
    {} as AppConfig['temps'],
  ),
  profiles: {
    Pump: [
      {
        temp: 0,
        pwm: pumpSpeedDesired,
      },
      {
        temp: 60,
        pwm: pumpSpeedDesired,
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
}

export const Config = new Conf<AppConfig>({ accessPropertiesByDotNotation: true, schema, defaults })
