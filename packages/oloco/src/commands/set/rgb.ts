import { Arguments, Argv } from 'yargs'
import { OLoCo, RgbColor, RgbMode, rgbmodeIterable, RgbSpeed, rgbspeedIterable } from '@oloco/oloco'
import { exit } from 'process'
import { logObject } from '../../cli.common'
import { Config } from '../../config'

export const command = 'rgb <mode> <speed> <color>'
export const describe = 'Configure RGB RGB mode, speed and color.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('mode', {
      choices: rgbmodeIterable,
      describe: 'The pattern.',
    })
    .positional('speed', {
      choices: rgbspeedIterable,
      describe: 'The speed.',
    })
    .positional('color', {
      type: 'string',
      describe: 'Color code in hex format, eg. #FF0000 for red.',
    })

export const handler = (yargs: Arguments): void => {
  const mode = yargs.mode as RgbMode
  const speed = yargs.speed as RgbSpeed
  const userColor = yargs.color as string
  if (!(userColor.length === 7 || userColor.startsWith('#'))) {
    console.log("Couln't set color: wrong format!")
    exit(1)
  }
  const color: RgbColor = {
    red: parseInt(userColor.slice(1, 3), 16),
    green: parseInt(userColor.slice(3, 5), 16),
    blue: parseInt(userColor.slice(5, 7), 16),
  }

  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  controller.setRgb({ mode, speed, color })
  const recv = controller.getRgb()
  controller.close()

  logObject(recv)
}
