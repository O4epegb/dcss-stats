export const cache = new Map<string, { promise: Promise<any>; ttl: number }>()
export const ttl = 1000 * 60 * 5
