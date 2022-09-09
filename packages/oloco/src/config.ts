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
import { dirname, resolve } from 'path'

export const schema: Schema<AppConfig> = {
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
      logFile: {
        type: 'string',
      },
      logFileMaxSizeMB: {
        type: 'number',
      },
      logLevel: {
        enum: LogLevels.slice(),
        type: 'string',
      },
      logMode: {
        enum: LogModes.slice(),
        type: 'string',
      },
      logTarget: {
        enum: LogTargets.slice(),
        type: 'string',
      },
      logThreshold: {
        type: 'number',
      },
      timestampFormat: {
        enum: TimestampFormats.slice(),
        type: 'string',
      },
    },
    required: [
      'interval',
      'logFile',
      'logFileMaxSizeMB',
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
}

export const defaults: Readonly<AppConfig> = {
  fans: FanPorts.reduce(
    (conf, port) => ({
      ...conf,
      [port]: {
        name: port,
        enabled: true,
        warning: 500,
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
  },
  daemon: {
    interval: 1000,
    logFile: resolve(dirname(new Conf({ configName: 'dummy' }).path), 'logfile.log'),
    logFileMaxSizeMB: 16,
    logLevel: 'Info',
    logMode: 'Text',
    logTarget: 'Console',
    logThreshold: 5,
    timestampFormat: 'ISO',
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
    {} as AppConfig['temps'],
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
}

export const Config = new Conf<AppConfig>({ accessPropertiesByDotNotation: true, schema, defaults })
