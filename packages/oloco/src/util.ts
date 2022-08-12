import { inspect } from 'util'

export function logObject(data: unknown): void {
  console.log(inspect(data, { depth: null, colors: true }))
}

export function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
