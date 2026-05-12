import { beforeEach, describe, expect, it } from 'vitest'

import {
  loadSessionHotPool,
  saveSessionHotPool,
} from '@/features/session-practice-hot-pool/storage'

describe('session hot pool storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('keeps native-language session pools isolated', () => {
    saveSessionHotPool('eng', 'deu', 'usage-als-wie', [
      { main: 'eins', remainingTurns: 2 },
    ])
    saveSessionHotPool('arb', 'deu', 'usage-als-wie', [
      { main: 'zwei', remainingTurns: 4 },
    ])

    expect(loadSessionHotPool('eng', 'deu', 'usage-als-wie')).toEqual([
      { main: 'eins', remainingTurns: 2 },
    ])
    expect(loadSessionHotPool('arb', 'deu', 'usage-als-wie')).toEqual([
      { main: 'zwei', remainingTurns: 4 },
    ])
  })
})
