import { inspect } from 'node:util'

export function logObject(data: unknown): void {
  console.log(inspect(data, { depth: Number.POSITIVE_INFINITY, colors: true }))
}

export function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}
