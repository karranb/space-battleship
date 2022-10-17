import universalLanguageDetect from '@unly/universal-language-detector'

import i18next from 'i18next'

import en from './langs/en'
import fr from './langs/fr'
import hu from './langs/hu'
import ina from './langs/ina'
import pt from './langs/pt'
import it from './langs/it'

const lng = universalLanguageDetect({
  supportedLanguages: ['en', 'fr', 'pt', 'hu', 'ina','it'],
  fallbackLanguage: 'en',
})

const languages: Record<string, Record<string, string>> = { en, fr, pt, hu, ina, it }

const resources = Object.entries(languages).reduce(
  (acc, [key, translation]) => ({
    ...acc,
    [key]: { translation },
  }),
  {}
)

i18next.init({
  lng,
  fallbackLng: 'en',
  resources,
})

export default i18next
