import semver from 'semver'
import { expect, test, describe } from 'vitest'
import { getFetchTimeout } from './loader'

const shortTimeout = 300000
const longTimeout = 1500000

describe('getFetchTimeout', () => {
  test(' returns correct timeout', () => {
    expect(getFetchTimeout(semver.coerce('0.31'), semver.coerce('0.31'))).toBe(shortTimeout)
    expect(getFetchTimeout(semver.coerce('0.31'), semver.coerce('0.30'))).toBe(shortTimeout)
    expect(getFetchTimeout(semver.coerce('0.32'), semver.coerce('0.30'))).toBe(longTimeout)
    expect(getFetchTimeout(semver.coerce('0.30'), semver.coerce('0.31'))).toBe(longTimeout)
    expect(getFetchTimeout(null, semver.coerce('0.31'))).toBe(longTimeout)
    expect(getFetchTimeout(null, null)).toBe(longTimeout)
    expect(getFetchTimeout(semver.coerce('0.31'), null)).toBe(longTimeout)
  })
})
