export interface LanguageCatalogEntry {
  code: string
  name: string
}

export interface LessonCatalogEntry {
  description?: string
  nativeLanguage: string
  name: string
  slug: string
  targetLanguage: string
}

interface LessonExerciseBase {
  bottom: string[]
  lesson: string
  main: string
  nativeLanguage: string
  targetLanguage: string
  top?: string
}

interface FlatExerciseContainer {
  kind: 'flat'
}

interface GroupExerciseContainer {
  groupId: string
  index: number
  kind: 'group'
  ordered: boolean
}

export type ExerciseContainer = FlatExerciseContainer | GroupExerciseContainer

export interface ChoiceExercise extends LessonExerciseBase {
  answers: [string, ...string[]]
  container: ExerciseContainer
  kind: 'choice'
}

export interface AnswerExercise extends LessonExerciseBase {
  answer: string
  container: ExerciseContainer
  kind: 'answer'
}

export interface RevealExercise extends LessonExerciseBase {
  container: ExerciseContainer
  kind: 'reveal'
  reveal: string
}

export type LessonExercise = ChoiceExercise | AnswerExercise | RevealExercise

export interface LessonExerciseGroup {
  exerciseKeys: string[]
  id: string
  ordered: boolean
}

export interface LessonData {
  description?: string
  exercises: LessonExercise[]
  groups: LessonExerciseGroup[]
  name: string
  nativeLanguage: string
  slug: string
  targetLanguage: string
}
