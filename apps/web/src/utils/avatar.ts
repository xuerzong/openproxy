const DEFAULT_APP_DOMAIN = 'aiproxy.shop'
const DEFAULT_STYLE = 'adventurer-neutral'

export const dicebearStyles = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'dylan',
  'fun-emoji',
  'glass',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral',
  'rings',
  'shapes',
  'thumbs',
] as const

export type DicebearStyle = (typeof dicebearStyles)[number]

export interface AvatarOptions {
  style?: DicebearStyle
  seed?: string
  flip?: boolean
  rotate?: number
  scale?: number
  radius?: number
  size?: number
  backgroundColor?: string
  backgroundType?: 'solid' | 'gradientLinear'
  backgroundRotation?: number
  translateX?: number
  translateY?: number
}

export const buildAvatarUrl = (options: AvatarOptions, appDomain?: string) => {
  const style = options.style || DEFAULT_STYLE
  const seed = options.seed || ''
  const base = `https://avatar.${appDomain || DEFAULT_APP_DOMAIN}/9.x/${style}/svg`
  const params = new URLSearchParams()
  params.set('seed', seed)
  if (options.flip) params.set('flip', 'true')
  if (options.rotate != null && options.rotate !== 0)
    params.set('rotate', String(options.rotate))
  if (options.scale != null && options.scale !== 100)
    params.set('scale', String(options.scale))
  if (options.radius != null && options.radius !== 0)
    params.set('radius', String(options.radius))
  if (options.size != null) params.set('size', String(options.size))
  if (options.backgroundColor)
    params.set('backgroundColor', options.backgroundColor)
  if (options.backgroundType)
    params.set('backgroundType', options.backgroundType)
  if (options.backgroundRotation != null && options.backgroundRotation !== 0)
    params.set('backgroundRotation', String(options.backgroundRotation))
  if (options.translateX != null && options.translateX !== 0)
    params.set('translateX', String(options.translateX))
  if (options.translateY != null && options.translateY !== 0)
    params.set('translateY', String(options.translateY))
  return `${base}?${params.toString()}`
}

export const getAvatarUrl = (seed: string, appDomain?: string) =>
  buildAvatarUrl({ seed }, appDomain)

export const parseAvatarOptions = (url: string): AvatarOptions => {
  try {
    const u = new URL(url)
    const pathParts = u.pathname.split('/')
    const styleIndex = pathParts.indexOf('9.x') + 1
    const style = (
      styleIndex > 0 ? pathParts[styleIndex] : DEFAULT_STYLE
    ) as DicebearStyle
    const params = u.searchParams
    return {
      style,
      seed: params.get('seed') || '',
      flip: params.get('flip') === 'true',
      rotate: Number(params.get('rotate') || 0),
      scale: Number(params.get('scale') || 100),
      radius: Number(params.get('radius') || 0),
      backgroundColor: params.get('backgroundColor') || '',
      backgroundType:
        (params.get('backgroundType') as 'solid' | 'gradientLinear') ||
        undefined,
      backgroundRotation: Number(params.get('backgroundRotation') || 0),
      translateX: Number(params.get('translateX') || 0),
      translateY: Number(params.get('translateY') || 0),
    }
  } catch {
    return { seed: '', style: DEFAULT_STYLE }
  }
}
