import { readonly, ref } from 'vue'

const storageKey = 'cloze-drill:native-language'
const preferredNativeLanguage = ref(loadStoredNativeLanguage())

export function usePreferredNativeLanguage() {
  return readonly(preferredNativeLanguage)
}

export function getPreferredNativeLanguage(): string | null {
  return preferredNativeLanguage.value
}

export function setPreferredNativeLanguage(code: string): void {
  const nextCode = code.trim()

  if (!nextCode) {
    clearPreferredNativeLanguage()
    return
  }

  preferredNativeLanguage.value = nextCode

  const storage = getLocalStorage()

  if (!storage) {
    return
  }

  storage.setItem(storageKey, nextCode)
}

export function clearPreferredNativeLanguage(): void {
  preferredNativeLanguage.value = null

  const storage = getLocalStorage()

  if (!storage) {
    return
  }

  storage.removeItem(storageKey)
}

function loadStoredNativeLanguage(): string | null {
  const storage = getLocalStorage()

  if (!storage) {
    return null
  }

  const storedCode = storage.getItem(storageKey)
  return storedCode?.trim() ? storedCode : null
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storage = window.localStorage

  if (
    typeof storage?.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null
  }

  return storage
}
