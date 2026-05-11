import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PracticeExercisePanel from '@/pages/lesson-practice/PracticeExercisePanel.vue'
import type { LessonExercise } from '@/entities/lesson-data/model'

function createChoiceExercise(): LessonExercise {
  return {
    answers: ['als', 'wie'],
    bottom: [],
    container: { kind: 'flat' },
    kind: 'choice',
    language: 'deu',
    lesson: 'usage-als-wie',
    main: 'Besser ＿ nichts.',
    top: 'Better than nothing.',
  }
}

describe('PracticeExercisePanel', () => {
  it('scores wrong after a wrong then correct multiple-choice attempt', async () => {
    const wrapper = mount(PracticeExercisePanel, {
      props: {
        exercise: createChoiceExercise(),
      },
    })
    const buttons = wrapper.findAll('button')
    const wrongButton = buttons.find((button) => button.text() === 'wie')
    const correctButton = buttons.find((button) => button.text() === 'als')

    if (!wrongButton || !correctButton) {
      throw new Error('Expected both multiple-choice buttons')
    }

    await wrongButton.trigger('click')
    await correctButton.trigger('click')

    expect(wrapper.emitted('answered')).toEqual([['wrong']])
    expect(wrapper.text()).toContain('als')
  })

  it('reveals inline answers before scoring answer cards', async () => {
    const wrapper = mount(PracticeExercisePanel, {
      props: {
        exercise: {
          answer: 'thớt',
          bottom: ['fish proverb'],
          container: { kind: 'flat' },
          kind: 'answer',
          language: 'vie',
          lesson: 'fun-idioms',
          main: 'giận cá chém ＿',
        },
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('thớt')

    const scoreButtons = wrapper.findAll('button')
    await scoreButtons[1].trigger('click')

    expect(wrapper.emitted('answered')).toEqual([['correct']])
  })

  it('reveals separate text before scoring reveal cards', async () => {
    const wrapper = mount(PracticeExercisePanel, {
      props: {
        exercise: {
          bottom: ['idiom'],
          container: { kind: 'flat' },
          kind: 'reveal',
          language: 'vie',
          lesson: 'fun-idioms',
          main: '＿ ＿ ＿ ＿',
          reveal: 'giận cá chém thớt',
        },
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('giận cá chém thớt')

    const scoreButtons = wrapper.findAll('button')
    await scoreButtons[0].trigger('click')

    expect(wrapper.emitted('answered')).toEqual([['wrong']])
  })

  it('shows the new badge but keeps normal multiple-choice flow for unseen choice cards', () => {
    const wrapper = mount(PracticeExercisePanel, {
      props: {
        exercise: createChoiceExercise(),
        isNewExercise: true,
      },
    })

    expect(wrapper.text()).toContain('new exercise')
    expect(wrapper.text()).not.toContain('I will remember')
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('auto-reveals unseen non-choice cards and emits remembered without scoring', async () => {
    const wrapper = mount(PracticeExercisePanel, {
      props: {
        exercise: {
          answer: 'thớt',
          bottom: ['fish proverb'],
          container: { kind: 'flat' },
          kind: 'answer',
          language: 'vie',
          lesson: 'fun-idioms',
          main: 'giận cá chém ＿',
        },
        isNewExercise: true,
      },
    })

    expect(wrapper.text()).toContain('new exercise')
    expect(wrapper.text()).toContain('thớt')
    expect(wrapper.text()).toContain('I will remember')

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('remembered')).toEqual([[]])
    expect(wrapper.emitted('answered')).toBeUndefined()
  })
})
