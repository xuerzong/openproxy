import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DicesIcon, RefreshCwIcon } from 'lucide-react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { Select } from '@openproxy/ui/Select'
import { Switch } from '@openproxy/ui/Switch'
import { Button } from '@openproxy/ui/Button'
import { cn } from '@openproxy/ui'
import {
  buildAvatarUrl,
  dicebearStyles,
  type AvatarOptions,
  type DicebearStyle,
} from '@/utils/avatar'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'

interface AvatarPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSeed?: string
  defaultOptions?: AvatarOptions
  onConfirm?: (url: string, options: AvatarOptions) => void
}

const bgColors = [
  '',
  'b6e3f4',
  'c0aede',
  'd1d4f9',
  'ffd5dc',
  'ffdfbf',
  'f0f0f0',
  'a3e635',
  'fbbf24',
  'fb923c',
  'f87171',
  'e879f9',
  '60a5fa',
  '34d399',
]

const scaleOptions = [80, 90, 100, 110, 120]
const rotateOptions = [0, 45, 90, 135, 180, 225, 270, 315]
const radiusOptions = [0, 10, 20, 30, 40, 50]

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  open,
  onOpenChange,
  defaultSeed = '',
  defaultOptions,
  onConfirm,
}) => {
  const { t } = useTranslation('common')
  const constsQuery = useConstsQuery()
  const appDomain = constsQuery.data?.appDomain

  const [style, setStyle] = useState<DicebearStyle>(
    defaultOptions?.style || 'adventurer-neutral'
  )
  const [seed, setSeed] = useState(defaultOptions?.seed || defaultSeed)
  const [flip, setFlip] = useState(defaultOptions?.flip || false)
  const [rotate, setRotate] = useState(defaultOptions?.rotate || 0)
  const [scale, setScale] = useState(defaultOptions?.scale || 100)
  const [radius, setRadius] = useState(defaultOptions?.radius || 0)
  const [backgroundColor, setBackgroundColor] = useState(
    defaultOptions?.backgroundColor || ''
  )

  useEffect(() => {
    if (open) {
      setStyle(defaultOptions?.style || 'adventurer-neutral')
      setSeed(defaultOptions?.seed || defaultSeed)
      setFlip(defaultOptions?.flip || false)
      setRotate(defaultOptions?.rotate || 0)
      setScale(defaultOptions?.scale || 100)
      setRadius(defaultOptions?.radius || 0)
      setBackgroundColor(defaultOptions?.backgroundColor || '')
    }
  }, [open, defaultSeed, defaultOptions])

  const currentOptions: AvatarOptions = useMemo(
    () => ({
      style,
      seed,
      flip,
      rotate,
      scale,
      radius,
      backgroundColor,
    }),
    [style, seed, flip, rotate, scale, radius, backgroundColor]
  )

  const previewUrl = useMemo(
    () => buildAvatarUrl(currentOptions, appDomain),
    [currentOptions, appDomain]
  )

  const randomSeed = () => setSeed(Math.random().toString(36).substring(2, 10))

  const handleConfirm = () => {
    onConfirm?.(previewUrl, currentOptions)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('avatar.pickTitle', { defaultValue: 'Choose Avatar' })}
      description={t('avatar.pickDescription', {
        defaultValue: 'Customize your avatar style and options.',
      })}
      width={720}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel'),
            confirmText: t('actions.confirm'),
          }}
          onCancel={() => onOpenChange(false)}
          onOk={handleConfirm}
        />
      }
    >
      <div className="flex flex-col gap-6">
        {/* Preview */}
        <div className="flex justify-center">
          <img
            className="w-24 h-24 rounded-xl border border-border"
            src={previewUrl}
            alt="avatar preview"
          />
        </div>

        {/* Seed */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {t('avatar.seed', { defaultValue: 'Seed' })}
          </label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder={t('avatar.seedPlaceholder', {
                defaultValue: 'Enter seed text',
              })}
            />
            <Button variant="outline" onClick={randomSeed}>
              <DicesIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Style grid */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {t('avatar.style', { defaultValue: 'Style' })}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {dicebearStyles.map((s) => (
              <button
                key={s}
                type="button"
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-all hover:border-primary/50',
                  s === style ? 'border-primary bg-primary/5' : 'border-border'
                )}
                onClick={() => setStyle(s)}
              >
                <img
                  className="w-10 h-10 rounded"
                  src={buildAvatarUrl({ style: s, seed }, appDomain)}
                  alt={s}
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Background color */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {t('avatar.backgroundColor', {
              defaultValue: 'Background Color',
            })}
          </label>
          <div className="flex flex-wrap gap-2">
            {bgColors.map((color) => (
              <button
                key={color || 'transparent'}
                type="button"
                className={cn(
                  'w-7 h-7 rounded-full border-2 cursor-pointer transition-all',
                  backgroundColor === color
                    ? 'border-primary scale-110'
                    : 'border-border'
                )}
                style={{
                  background: color
                    ? `#${color}`
                    : 'linear-gradient(135deg, #fff 45%, #f87171 45%, #f87171 55%, #fff 55%)',
                }}
                onClick={() => setBackgroundColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Options row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {t('avatar.scale', { defaultValue: 'Scale' })}
            </label>
            <Select
              value={String(scale)}
              onChange={(v) => setScale(Number(v))}
              options={scaleOptions.map((v) => ({
                value: String(v),
                label: `${v}%`,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {t('avatar.rotate', { defaultValue: 'Rotate' })}
            </label>
            <Select
              value={String(rotate)}
              onChange={(v) => setRotate(Number(v))}
              options={rotateOptions.map((v) => ({
                value: String(v),
                label: `${v}°`,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {t('avatar.radius', { defaultValue: 'Radius' })}
            </label>
            <Select
              value={String(radius)}
              onChange={(v) => setRadius(Number(v))}
              options={radiusOptions.map((v) => ({
                value: String(v),
                label: `${v}`,
              }))}
            />
          </div>
        </div>

        {/* Flip */}
        <div className="flex items-center gap-2">
          <Switch checked={flip} onCheckedChange={setFlip} />
          <label className="text-sm font-medium">
            {t('avatar.flip', { defaultValue: 'Flip' })}
          </label>
        </div>

        {/* Powered by DiceBear */}
        <div className="text-center text-xs text-muted-foreground">
          {t('avatar.poweredBy', { defaultValue: 'Powered by DiceBear' })}
        </div>
      </div>
    </Dialog>
  )
}
