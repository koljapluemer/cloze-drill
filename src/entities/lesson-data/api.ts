import type {
  LanguageCatalogEntry,
  LessonCatalogEntry,
  LessonData,
  LessonExercise,
  LessonExerciseGroup,
} from '@/entities/lesson-data/model'

type RawCatalog = Record<string, { description?: string; name: string }>

type RawExercise = {
  answer?: string
  answers?: string[]
  bottom?: string | string[]
  main: string
  reveal?: string
  top?: string
}

type RawExerciseGroup = {
  exercises: RawExercise[]
  ordered: boolean
}

const jsonCache = new Map<string, Promise<unknown>>()

export async function loadNativeLanguageIndex(): Promise<LanguageCatalogEntry[]> {
  const raw = await fetchJson<RawCatalog>('/cloze-drill-data/out/native_languages.json')

  return Object.entries(raw).map(([code, value]) => ({
    code,
    name: value.name,
  }))
}

export async function loadTargetLanguageIndex(
  nativeLanguage: string,
): Promise<LanguageCatalogEntry[]> {
  const raw = await fetchJson<RawCatalog>(
    `/cloze-drill-data/out/${nativeLanguage}/target_languages.json`,
  )

  return Object.entries(raw).map(([code, value]) => ({
    code,
    name: value.name,
  }))
}

export async function loadLessonIndex(
  nativeLanguage: string,
  targetLanguage: string,
): Promise<LessonCatalogEntry[]> {
  const raw = await fetchJson<RawCatalog>(
    `/cloze-drill-data/out/${nativeLanguage}/${targetLanguage}/index.json`,
  )

  return Object.entries(raw).map(([slug, value]) => ({
    description: value.description,
    nativeLanguage,
    name: value.name,
    slug,
    targetLanguage,
  }))
}

export async function loadLesson(
  nativeLanguage: string,
  targetLanguage: string,
  slug: string,
): Promise<LessonData> {
  const [catalog, rawLesson] = await Promise.all([
    loadLessonIndex(nativeLanguage, targetLanguage),
    fetchJson<unknown>(
      `/cloze-drill-data/out/${nativeLanguage}/${targetLanguage}/data/${slug}.json`,
    ),
  ])

  const lessonMeta = catalog.find((entry) => entry.slug === slug)

  if (!lessonMeta) {
    throw new Error(`Unknown lesson: ${nativeLanguage}/${targetLanguage}/${slug}`)
  }

  return normalizeLesson(nativeLanguage, targetLanguage, lessonMeta, rawLesson)
}

async function fetchJson<T>(path: string): Promise<T> {
  let pending = jsonCache.get(path)

  if (!pending) {
    pending = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}`)
      }

      return response.json()
    })

    jsonCache.set(path, pending)
  }

  return pending as Promise<T>
}

function isRawExerciseGroup(value: unknown): value is RawExerciseGroup {
  return (
    isRecord(value) &&
    typeof value.ordered === 'boolean' &&
    Array.isArray(value.exercises)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeBottom(value: unknown): string[] {
  if (typeof value === 'undefined') {
    return []
  }

  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value
  }

  throw new Error('Invalid lesson bottom field')
}

function normalizeExercise(
  nativeLanguage: string,
  targetLanguage: string,
  lesson: string,
  raw: unknown,
  container: LessonExercise['container'],
): LessonExercise {
  if (!isRecord(raw) || typeof raw.main !== 'string') {
    throw new Error('Invalid lesson exercise')
  }

  const top = typeof raw.top === 'string' ? raw.top : undefined
  const bottom = normalizeBottom(raw.bottom)
  const variantCount = Number(Array.isArray(raw.answers)) +
    Number(typeof raw.answer === 'string') +
    Number(typeof raw.reveal === 'string')

  if (variantCount !== 1) {
    throw new Error(`Exercise ${raw.main} must define exactly one answer mode`)
  }

  if (Array.isArray(raw.answers)) {
    if (
      raw.answers.length === 0 ||
      raw.answers.some((answer) => typeof answer !== 'string')
    ) {
      throw new Error(`Exercise ${raw.main} has invalid answers`)
    }

    return {
      answers: raw.answers as [string, ...string[]],
      bottom,
      container,
      kind: 'choice',
      lesson,
      main: raw.main,
      nativeLanguage,
      targetLanguage,
      top,
    }
  }

  if (typeof raw.answer === 'string') {
    return {
      answer: raw.answer,
      bottom,
      container,
      kind: 'answer',
      lesson,
      main: raw.main,
      nativeLanguage,
      targetLanguage,
      top,
    }
  }

  return {
    bottom,
    container,
    kind: 'reveal',
    lesson,
    main: raw.main,
    nativeLanguage,
    reveal: raw.reveal as string,
    targetLanguage,
    top,
  }
}

function normalizeLesson(
  nativeLanguage: string,
  targetLanguage: string,
  lessonMeta: LessonCatalogEntry,
  rawLesson: unknown,
): LessonData {
  if (!Array.isArray(rawLesson)) {
    throw new Error(`Lesson ${lessonMeta.slug} must be an array`)
  }

  const groups: LessonExerciseGroup[] = []
  const exercises = rawLesson.every(isRawExerciseGroup)
    ? rawLesson.flatMap((group, groupIndex) => {
        const groupId = `${lessonMeta.slug}:${groupIndex}`
        const groupExercises = group.exercises.map((exercise, exerciseIndex) =>
          normalizeExercise(nativeLanguage, targetLanguage, lessonMeta.slug, exercise, {
            groupId,
            index: exerciseIndex,
            kind: 'group',
            ordered: group.ordered,
          }),
        )

        groups.push({
          exerciseKeys: groupExercises.map((exercise) => exercise.main),
          id: groupId,
          ordered: group.ordered,
        })

        return groupExercises
      })
    : rawLesson.map((exercise) =>
        normalizeExercise(nativeLanguage, targetLanguage, lessonMeta.slug, exercise, {
          kind: 'flat',
        }),
      )

  return {
    description: lessonMeta.description,
    exercises,
    groups,
    name: lessonMeta.name,
    nativeLanguage,
    slug: lessonMeta.slug,
    targetLanguage,
  }
}
