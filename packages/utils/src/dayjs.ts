import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { Locale as DayPickerLocale } from 'react-day-picker'
import { enUS, zhCN } from 'react-day-picker/locale'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'

export type { Dayjs } from 'dayjs'

export const DEFAULT_LOCALE_CODE = 'zh-CN'
export type SupportedLocaleCode = 'zh-CN' | 'en-US'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault('Asia/Shanghai')

const localeListeners = new Set<() => void>()

export const normalizeLocaleCode = (
  localeCode?: string | null
): SupportedLocaleCode => {
  return localeCode?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

export const resolveDayjsLocale = (localeCode?: string | null) => {
  return normalizeLocaleCode(localeCode) === 'zh-CN' ? 'zh-cn' : 'en'
}

export const resolveDayPickerLocale = (
  localeCode?: string | null
): DayPickerLocale => {
  return normalizeLocaleCode(localeCode) === 'zh-CN' ? zhCN : enUS
}

const detectLocaleCode = (): SupportedLocaleCode => {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return normalizeLocaleCode(document.documentElement.lang)
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLocaleCode(navigator.language)
  }

  return DEFAULT_LOCALE_CODE
}

let currentLocaleCode = detectLocaleCode()

dayjs.locale(resolveDayjsLocale(currentLocaleCode))

const syncDocumentLanguage = (localeCode: SupportedLocaleCode) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = localeCode
  }
}

export const getDateLocaleCode = () => currentLocaleCode

export const subscribeDateLocaleChange = (listener: () => void) => {
  localeListeners.add(listener)

  return () => {
    localeListeners.delete(listener)
  }
}

export const setDateLocale = (localeCode?: string | null) => {
  const nextLocaleCode = normalizeLocaleCode(localeCode ?? detectLocaleCode())
  const nextDayjsLocale = resolveDayjsLocale(nextLocaleCode)

  currentLocaleCode = nextLocaleCode
  dayjs.locale(nextDayjsLocale)
  syncDocumentLanguage(nextLocaleCode)

  localeListeners.forEach((listener) => {
    listener()
  })

  return nextLocaleCode
}

export default dayjs
