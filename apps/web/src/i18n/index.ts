import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import { setDateLocale } from '@openproxy/utils/dayjs'

i18n.on('languageChanged', (language) => {
  setDateLocale(language)
})

void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US'],
    ns: ['common'],
    defaultNS: 'common',
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
    },
  })
  .then(() => {
    setDateLocale(i18n.resolvedLanguage ?? i18n.language)
  })

export default i18n
