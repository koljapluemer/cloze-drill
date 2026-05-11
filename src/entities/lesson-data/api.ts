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

export async function loadLanguageIndex(): Promise<LanguageCatalogEntry[]> {
  const raw = await fetchJson<RawCatalog>('/cloze-drill-data/index.json')

  return Object.entries(raw).map(([code, value]) => ({
    code,
    name: value.name,
  }))
}

export async function loadLessonIndex(
  language: string,
): Promise<LessonCatalogEntry[]> {
  const raw = await fetchJson<RawCatalog>(`/cloze-drill-data/${language}/index.json`)

  return Object.entries(raw).map(([slug, value]) => ({
    description: value.description,
    language,
    name: value.name,
    slug,
  }))
}

export async function loadLesson(
  language: string,
  slug: string,
): Promise<LessonData> {
  const [catalog, rawLesson] = await Promise.all([
    loadLessonIndex(language),
    fetchJson<unknown>(`/cloze-drill-data/${language}/data/${slug}.json`),
  ])

  const lessonMeta = catalog.find((entry) => entry.slug === slug)

  if (!lessonMeta) {
    throw new Error(`Unknown lesson: ${language}/${slug}`)
  }

  return normalizeLesson(language, lessonMeta, rawLesson)
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
  language: string,
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
      language,
      lesson,
      main: raw.main,
      top,
    }
  }

  if (typeof raw.answer === 'string') {
    return {
      answer: raw.answer,
      bottom,
      container,
      kind: 'answer',
      language,
      lesson,
      main: raw.main,
      top,
    }
  }

  return {
    bottom,
    container,
    kind: 'reveal',
    language,
    lesson,
    main: raw.main,
    reveal: raw.reveal as string,
    top,
  }
}

function normalizeLesson(
  language: string,
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
          normalizeExercise(language, lessonMeta.slug, exercise, {
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
        normalizeExercise(language, lessonMeta.slug, exercise, {
          kind: 'flat',
        }),
      )

  return {
    description: lessonMeta.description,
    exercises,
    groups,
    language,
    name: lessonMeta.name,
    slug: lessonMeta.slug,
  }
}
