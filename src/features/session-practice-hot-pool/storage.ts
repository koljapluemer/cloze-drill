import type { HotPoolEntry } from '@/entities/exercise-progress/model'

export function clearSessionHotPool(language: string, lesson: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(storageKey(language, lesson))
}

export function loadSessionHotPool(
  language: string,
  lesson: string,
): HotPoolEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.sessionStorage.getItem(storageKey(language, lesson))

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isHotPoolEntry)
  } catch {
    return []
  }
}

export function saveSessionHotPool(
  language: string,
  lesson: string,
  hotPool: HotPoolEntry[],
): void {
  if (typeof window === 'undefined') {
    return
  }

  const plainHotPool = hotPool.map((entry) => ({
    main: entry.main,
    remainingTurns: entry.remainingTurns,
  }))

  window.sessionStorage.setItem(
    storageKey(language, lesson),
    JSON.stringify(plainHotPool),
  )
}

function isHotPoolEntry(value: unknown): value is HotPoolEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.main === 'string' &&
    typeof candidate.remainingTurns === 'number' &&
    Number.isFinite(candidate.remainingTurns)
  )
}

function storageKey(language: string, lesson: string): string {
  return `cloze-drill:hot-pool:${language}:${lesson}`
}
