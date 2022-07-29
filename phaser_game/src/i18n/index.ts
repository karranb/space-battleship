import i18next from 'i18next'

import en from './langs/en'
import pt from './langs/pt'

const languages: Record<string, Record<string, string>> = { en, pt }

const resources = Object.entries(languages).reduce(
  (acc, [key, translation]) => ({
    ...acc,
    [key]: { translation },
  }),
  {}
)

i18next.init({
  fallbackLng: 'en',
  resources,
})

export default i18next
