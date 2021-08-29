import { FanPort, LightData, TempPort } from '@ek-loop-connect/ek-lib'
import { FanProfileName, FanProfilePoint, LogLevel, LogTarget } from './common'
import balanced from './res/balanced.json'
import Conf from 'conf'

export type Config = {
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

export const config = new Conf<Config>({
  accessPropertiesByDotNotation: true,
  schema: {
    fans: {
      additionalProperties: false,
      properties: {
        fan1: {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: ['silent', 'balanced', 'max', 'custom'],
              type: 'string',
            },
            customProfile: {
              items: {
                additionalProperties: false,
                properties: {
                  x: {
                    type: 'number',
                  },
                  y: {
                    type: 'number',
                  },
                },
                required: ['x', 'y'],
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
            tempSource: {
              enum: ['temp1', 'temp2', 'temp3'],
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'tempSource', 'activeProfile', 'customProfile'],
          type: 'object',
        },
        fan2: {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: ['silent', 'balanced', 'max', 'custom'],
              type: 'string',
            },
            customProfile: {
              items: {
                additionalProperties: false,
                properties: {
                  x: {
                    type: 'number',
                  },
                  y: {
                    type: 'number',
                  },
                },
                required: ['x', 'y'],
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
            tempSource: {
              enum: ['temp1', 'temp2', 'temp3'],
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'tempSource', 'activeProfile', 'customProfile'],
          type: 'object',
        },
        fan3: {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: ['silent', 'balanced', 'max', 'custom'],
              type: 'string',
            },
            customProfile: {
              items: {
                additionalProperties: false,
                properties: {
                  x: {
                    type: 'number',
                  },
                  y: {
                    type: 'number',
                  },
                },
                required: ['x', 'y'],
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
            tempSource: {
              enum: ['temp1', 'temp2', 'temp3'],
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'tempSource', 'activeProfile', 'customProfile'],
          type: 'object',
        },
        fan4: {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: ['silent', 'balanced', 'max', 'custom'],
              type: 'string',
            },
            customProfile: {
              items: {
                additionalProperties: false,
                properties: {
                  x: {
                    type: 'number',
                  },
                  y: {
                    type: 'number',
                  },
                },
                required: ['x', 'y'],
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
            tempSource: {
              enum: ['temp1', 'temp2', 'temp3'],
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'tempSource', 'activeProfile', 'customProfile'],
          type: 'object',
        },
        fan5: {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: ['silent', 'balanced', 'max', 'custom'],
              type: 'string',
            },
            customProfile: {
              items: {
                additionalProperties: false,
                properties: {
                  x: {
                    type: 'number',
                  },
                  y: {
                    type: 'number',
                  },
                },
                required: ['x', 'y'],
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
            tempSource: {
              enum: ['temp1', 'temp2', 'temp3'],
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'tempSource', 'activeProfile', 'customProfile'],
          type: 'object',
        },
        fan6: {
          additionalProperties: false,
          properties: {
            activeProfile: {
              enum: ['silent', 'balanced', 'max', 'custom'],
              type: 'string',
            },
            customProfile: {
              items: {
                additionalProperties: false,
                properties: {
                  x: {
                    type: 'number',
                  },
                  y: {
                    type: 'number',
                  },
                },
                required: ['x', 'y'],
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
            tempSource: {
              enum: ['temp1', 'temp2', 'temp3'],
              type: 'string',
            },
            warning: {
              type: 'number',
            },
          },
          required: ['name', 'enabled', 'warning', 'tempSource', 'activeProfile', 'customProfile'],
          type: 'object',
        },
      },
      required: ['fan1', 'fan2', 'fan3', 'fan4', 'fan5', 'fan6'],
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
          enum: [
            'off',
            'static',
            'breathing',
            'fading',
            'marquee',
            'coveringMarquee',
            'pulse',
            'spectrumWave',
            'alternating',
            'candle',
          ],
          type: 'string',
        },
        speed: {
          enum: [
            'slowest',
            'slower',
            'slow',
            'slowish',
            'normal',
            'fastish',
            'fast',
            'faster',
            'fastest',
          ],
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
    sensors: {
      additionalProperties: false,
      properties: {
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
        temps: {
          additionalProperties: false,
          properties: {
            temp1: {
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
            temp2: {
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
            temp3: {
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
          required: ['temp1', 'temp2', 'temp3'],
          type: 'object',
        },
      },
      required: ['temps', 'flow', 'level'],
      type: 'object',
    },
  },
  defaults: {
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
  },
})
