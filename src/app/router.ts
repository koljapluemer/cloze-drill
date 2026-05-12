import { createRouter, createWebHistory } from 'vue-router'

import {
  createNativeLanguageRedirect,
  nativeLanguageSelectRouteName,
  requiresNativeLanguage,
  targetLanguageSelectRouteName,
} from '@/app/native-language-routing'
import { getPreferredNativeLanguage } from '@/entities/native-language-preference/api'
import LessonPracticePage from '@/pages/lesson-practice/LessonPracticePage.vue'
import LessonSelectPage from '@/pages/lesson-select/LessonSelectPage.vue'
import NativeLanguageSelectPage from '@/pages/native-language-select/NativeLanguageSelectPage.vue'
import TargetLanguageSelectPage from '@/pages/target-language-select/TargetLanguageSelectPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/native-language',
      name: nativeLanguageSelectRouteName,
      component: NativeLanguageSelectPage,
    },
    {
      path: '/',
      name: targetLanguageSelectRouteName,
      component: TargetLanguageSelectPage,
    },
    {
      path: '/:targetLanguage',
      name: 'lesson-select',
      component: LessonSelectPage,
      props: true,
    },
    {
      path: '/:targetLanguage/:lesson/practice',
      name: 'lesson-practice',
      component: LessonPracticePage,
      props: true,
    },
  ],
})

router.beforeEach((to) => {
  if (!requiresNativeLanguage(to.name)) {
    return true
  }

  if (getPreferredNativeLanguage()) {
    return true
  }

  return createNativeLanguageRedirect(to.fullPath)
})

export default router
