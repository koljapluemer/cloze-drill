import type { HotPoolEntry } from '@/entities/exercise-progress/model'

export function clearSessionHotPool(
  nativeLanguage: string,
  targetLanguage: string,
  lesson: string,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(
    storageKey(nativeLanguage, targetLanguage, lesson),
  )
}

export function loadSessionHotPool(
  nativeLanguage: string,
  targetLanguage: string,
  lesson: string,
): HotPoolEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.sessionStorage.getItem(
    storageKey(nativeLanguage, targetLanguage, lesson),
  )

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
  nativeLanguage: string,
  targetLanguage: string,
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
    storageKey(nativeLanguage, targetLanguage, lesson),
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

function storageKey(
  nativeLanguage: string,
  targetLanguage: string,
  lesson: string,
): string {
  return `cloze-drill:hot-pool:${nativeLanguage}:${targetLanguage}:${lesson}`
}
