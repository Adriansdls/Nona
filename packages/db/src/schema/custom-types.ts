import { customType } from 'drizzle-orm/pg-core'

export const point = customType<{
  data: { x: number; y: number }
  driverData: string
}>({
  dataType() {
    return 'point'
  },
  toDriver(value) {
    return `(${value.x},${value.y})`
  },
  fromDriver(value: string) {
    const m = value.match(/\(([^,]+),([^)]+)\)/)
    if (!m) throw new Error(`Invalid point: ${value}`)
    return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) }
  },
})

export const vector = customType<{
  data: number[]
  driverData: string
  config: { dimensions: number }
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`
  },
  toDriver(value) {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string) {
    return value.slice(1, -1).split(',').map(Number)
  },
})
