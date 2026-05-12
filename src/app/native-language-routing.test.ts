import { describe, expect, it } from 'vitest'

import {
  createNativeLanguageRedirect,
  lessonPracticeRouteName,
  lessonSelectRouteName,
  resolveRouteForNativeLanguage,
  targetLanguageSelectRouteName,
} from '@/app/native-language-routing'

describe('native language routing', () => {
  it('preserves the redirect path when native language is missing', () => {
    expect(createNativeLanguageRedirect('/deu/usage-als-wie/practice')).toEqual({
      name: 'native-language-select',
      query: {
        redirect: '/deu/usage-als-wie/practice',
      },
    })
  })

  it('keeps a practice route when target language and lesson exist', async () => {
    const nextLocation = await resolveRouteForNativeLanguage(
      {
        fullPath: '/deu/usage-als-wie/practice',
        name: lessonPracticeRouteName,
        params: {
          lesson: 'usage-als-wie',
          targetLanguage: 'deu',
        },
      },
      'eng',
      {
        async loadLessonIndex() {
          return [
            {
              name: 'Usage Als Wie',
              nativeLanguage: 'eng',
              slug: 'usage-als-wie',
              targetLanguage: 'deu',
            },
          ]
        },
        async loadTargetLanguageIndex() {
          return [{ code: 'deu', name: 'German' }]
        },
      },
    )

    expect(nextLocation).toEqual({
      name: lessonPracticeRouteName,
      params: {
        lesson: 'usage-als-wie',
        targetLanguage: 'deu',
      },
    })
  })

  it('falls back from practice to the lesson list when the lesson is missing', async () => {
    const nextLocation = await resolveRouteForNativeLanguage(
      {
        fullPath: '/deu/usage-als-wie/practice',
        name: lessonPracticeRouteName,
        params: {
          lesson: 'usage-als-wie',
          targetLanguage: 'deu',
        },
      },
      'eng',
      {
        async loadLessonIndex() {
          return []
        },
        async loadTargetLanguageIndex() {
          return [{ code: 'deu', name: 'German' }]
        },
      },
    )

    expect(nextLocation).toEqual({
      name: lessonSelectRouteName,
      params: {
        targetLanguage: 'deu',
      },
    })
  })

  it('falls back to the target-language list when the target language is missing', async () => {
    const nextLocation = await resolveRouteForNativeLanguage(
      {
        fullPath: '/deu',
        name: lessonSelectRouteName,
        params: {
          targetLanguage: 'deu',
        },
      },
      'arb',
      {
        async loadLessonIndex() {
          return []
        },
        async loadTargetLanguageIndex() {
          return [{ code: 'vie', name: 'Vietnamese' }]
        },
      },
    )

    expect(nextLocation).toEqual({
      name: targetLanguageSelectRouteName,
    })
  })
})
