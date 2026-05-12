import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPreferredNativeLanguage,
  getPreferredNativeLanguage,
  setPreferredNativeLanguage,
} from '@/entities/native-language-preference/api'

describe('native language preference', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createLocalStorageMock(),
    })
    window.localStorage.clear()
    clearPreferredNativeLanguage()
  })

  it('returns null when no preference is set', () => {
    expect(getPreferredNativeLanguage()).toBeNull()
  })

  it('persists and returns the selected native language', () => {
    setPreferredNativeLanguage('eng')

    expect(getPreferredNativeLanguage()).toBe('eng')
    expect(window.localStorage.getItem('cloze-drill:native-language')).toBe('eng')
  })
})

function createLocalStorageMock(): Storage {
  const values = new Map<string, string>()

  return {
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    get length() {
      return values.size
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}
