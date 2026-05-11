import { createRouter, createWebHistory } from 'vue-router'

import LanguageSelectPage from '@/pages/language-select/LanguageSelectPage.vue'
import LessonPracticePage from '@/pages/lesson-practice/LessonPracticePage.vue'
import LessonSelectPage from '@/pages/lesson-select/LessonSelectPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'language-select',
      component: LanguageSelectPage,
    },
    {
      path: '/:language',
      name: 'lesson-select',
      component: LessonSelectPage,
      props: true,
    },
    {
      path: '/:language/:lesson/practice',
      name: 'lesson-practice',
      component: LessonPracticePage,
      props: true,
    },
  ],
})

export default router
