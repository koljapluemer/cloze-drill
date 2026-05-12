import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'

import {
  loadLessonIndex,
  loadTargetLanguageIndex,
} from '@/entities/lesson-data/api'

export const nativeLanguageSelectRouteName = 'native-language-select'
export const targetLanguageSelectRouteName = 'target-language-select'
export const lessonSelectRouteName = 'lesson-select'
export const lessonPracticeRouteName = 'lesson-practice'

interface RouteCatalogLoaders {
  loadLessonIndex: typeof loadLessonIndex
  loadTargetLanguageIndex: typeof loadTargetLanguageIndex
}

interface SupportedRoute {
  fullPath: string
  name: RouteLocationNormalizedLoaded['name'] | null
  params: RouteLocationNormalizedLoaded['params']
}

const defaultLoaders: RouteCatalogLoaders = {
  loadLessonIndex,
  loadTargetLanguageIndex,
}

export function createNativeLanguageRedirect(
  fullPath: string,
): RouteLocationRaw {
  return {
    name: nativeLanguageSelectRouteName,
    query: {
      redirect: fullPath,
    },
  }
}

export function requiresNativeLanguage(
  routeName: RouteLocationNormalizedLoaded['name'],
): boolean {
  return routeName !== nativeLanguageSelectRouteName
}

export async function resolveRouteForNativeLanguage(
  route: SupportedRoute,
  nativeLanguage: string,
  loaders: RouteCatalogLoaders = defaultLoaders,
): Promise<RouteLocationRaw> {
  if (route.name === lessonSelectRouteName || route.name === lessonPracticeRouteName) {
    const targetLanguage = getRouteParam(route.params, 'targetLanguage')

    if (!targetLanguage) {
      return { name: targetLanguageSelectRouteName }
    }

    const targetLanguages = await loaders.loadTargetLanguageIndex(nativeLanguage)
    const hasTargetLanguage = targetLanguages.some(
      (entry) => entry.code === targetLanguage,
    )

    if (!hasTargetLanguage) {
      return { name: targetLanguageSelectRouteName }
    }

    if (route.name === lessonSelectRouteName) {
      return {
        name: lessonSelectRouteName,
        params: { targetLanguage },
      }
    }

    const lesson = getRouteParam(route.params, 'lesson')

    if (!lesson) {
      return {
        name: lessonSelectRouteName,
        params: { targetLanguage },
      }
    }

    const lessons = await loaders.loadLessonIndex(nativeLanguage, targetLanguage)
    const hasLesson = lessons.some((entry) => entry.slug === lesson)

    if (!hasLesson) {
      return {
        name: lessonSelectRouteName,
        params: { targetLanguage },
      }
    }

    return {
      name: lessonPracticeRouteName,
      params: {
        lesson,
        targetLanguage,
      },
    }
  }

  return { name: targetLanguageSelectRouteName }
}

function getRouteParam(
  params: RouteLocationNormalizedLoaded['params'],
  key: string,
): string | undefined {
  const value = params[key]

  if (typeof value === 'string') {
    return value
  }

  return Array.isArray(value) ? value[0] : undefined
}
