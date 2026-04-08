import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'
import { DEFAULT_PREFERENCES } from '@/lib/api/userPreferences'

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

const detector = new LanguageDetector()

detector.addDetector({
  name: 'userPreference',
  cacheUserLanguage: () => {}, // We handle caching via user preferences
  lookup(): string | undefined {
    // Try to get language from URL params or session storage
    const params = new URLSearchParams(window.location.search)
    return params.get('lang') ?? undefined
  },
})

i18next
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['userLanguage', 'navigator'],
      caches: [],
      lookupLocalStorage: 'i18nextLng',
    },
  })

// Set initial language from user preferences or detection
export function initializeLanguage(userLanguage?: string) {
  const language = userLanguage || DEFAULT_PREFERENCES.language
  if (SUPPORTED_LANGUAGES.includes(language as Language)) {
    i18next.changeLanguage(language)
  }
}

export default i18next
