import { UAParser } from 'ua-parser-js'

export const parseUserAgent = (ua?: string | null): string => {
  if (!ua) return 'Unknown Device'
  const { browser, os } = new UAParser(ua).getResult()
  const parts = [
    browser.name && `${browser.name} ${browser.version ?? ''}`.trim(),
    os.name && `${os.name} ${os.version ?? ''}`.trim(),
  ].filter(Boolean)
  return parts.join(' / ') || 'Unknown Device'
}
