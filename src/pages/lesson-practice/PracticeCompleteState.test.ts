import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PracticeCompleteState from '@/pages/lesson-practice/PracticeCompleteState.vue'

describe('PracticeCompleteState', () => {
  it('emits back and infinite actions', async () => {
    const wrapper = mount(PracticeCompleteState)
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('back')).toHaveLength(1)
    expect(wrapper.emitted('infinite')).toHaveLength(1)
  })
})
