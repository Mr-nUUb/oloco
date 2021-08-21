import { Arguments, Argv } from 'yargs'
import { openController, lightModeChoices, lightSpeedChoices } from '../../common'
import { getLights, LightColor, LightMode, LightSpeed, setLights } from '@ek-loop-connect/ek-lib'
import { exit } from 'process'

export const command = 'light <mode> <speed> <color>'
export const describe = 'Configure RGB lights.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('mode', {
      choices: lightModeChoices,
      describe: 'The pattern.',
    })
    .positional('speed', {
      choices: lightSpeedChoices,
      describe: 'The speed.',
    })
    .positional('color', {
      type: 'string',
      describe: 'Color code in hex format, eg. #FF0000 for red.',
    })

export const handler = (yargs: Arguments): void => {
  const mode = yargs.mode as LightMode
  const speed = yargs.speed as LightSpeed
  const userColor = yargs.color as string
  if (!(userColor.length === 7 || userColor.startsWith('#'))) {
    console.log("Couln't set color: wrong format!")
    exit(1)
  }
  const color: LightColor = {
    red: parseInt(userColor.slice(1, 3), 16),
    green: parseInt(userColor.slice(3, 5), 16),
    blue: parseInt(userColor.slice(5, 7), 16),
  }
  const controller = openController()

  setLights(controller, { mode, speed, color })
  const recv = getLights(controller)

  controller.close()
  console.log(recv)
}
