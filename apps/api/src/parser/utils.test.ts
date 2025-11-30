import { describe, expect, it } from 'vitest'
import { getVersionIntegerFromString, getVersionStringFromInteger } from './utils'

describe('utils', () => {
  describe('getVersionIntegerFromString', () => {
    it('should convert version string to integer correctly', () => {
      expect(getVersionIntegerFromString('0.31')).toBe(31)
      expect(getVersionIntegerFromString('0.4')).toBe(4)
      expect(getVersionIntegerFromString('1.0')).toBe(1000)
      expect(getVersionIntegerFromString('1.5')).toBe(1005)
      expect(getVersionIntegerFromString('0.0')).toBe(0)
      expect(getVersionIntegerFromString('0.123')).toBe(123)
      expect(getVersionIntegerFromString('5.123')).toBe(5123)
      expect(getVersionIntegerFromString('10.5')).toBe(10005)
    })
  })

  describe('getVersionStringFromInteger', () => {
    it('should convert integer to version string correctly', () => {
      expect(getVersionStringFromInteger(31)).toBe('0.31')
      expect(getVersionStringFromInteger(4)).toBe('0.4')
      expect(getVersionStringFromInteger(1000)).toBe('1.0')
      expect(getVersionStringFromInteger(1005)).toBe('1.5')
      expect(getVersionStringFromInteger(0)).toBe('0.0')
      expect(getVersionStringFromInteger(123)).toBe('0.123')
      expect(getVersionStringFromInteger(5123)).toBe('5.123')
      expect(getVersionStringFromInteger(10005)).toBe('10.5')
    })
  })
})
