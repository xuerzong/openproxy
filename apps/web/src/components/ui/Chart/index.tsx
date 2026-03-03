import React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/utils/cn'
import s from './index.module.css'

const THEMES = { light: '', dark: '.dark' } as const

type ThemeName = keyof typeof THEMES

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Partial<Record<ThemeName, string>>
  }
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

const useChart = () => {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

type ChartContainerProps = React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={cn(s.ChartRoot, className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})

ChartContainer.displayName = 'ChartContainer'

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.color || itemConfig.theme
  )

  if (!colorConfig.length) {
    return null
  }

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const declarations = colorConfig
        .map(([key, itemConfig]) => {
          const color =
            itemConfig.theme?.[theme as ThemeName] ?? itemConfig.color
          return color ? `  --color-${key}: ${color};` : null
        })
        .filter((line): line is string => Boolean(line))

      if (!declarations.length) {
        return ''
      }

      return `${prefix} [data-chart=${id}] {\n${declarations.join('\n')}\n}`
    })
    .filter(Boolean)
    .join('\n')

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

type PayloadItem = {
  [key: string]: unknown
  color?: string
  dataKey?: string | number
  name?: string | number
  value?: React.ReactNode
  payload?: Record<string, unknown>
  fill?: string
}

type ChartTooltipContentProps = React.ComponentProps<'div'> & {
  active?: boolean
  payload?: PayloadItem[]
  className?: string
  indicator?: 'line' | 'dot' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: string | number
  labelFormatter?: (
    value: React.ReactNode,
    payload: PayloadItem[]
  ) => React.ReactNode
  formatter?: (
    value: React.ReactNode,
    name: React.ReactNode,
    item: PayloadItem,
    index: number,
    payload: PayloadItem[]
  ) => React.ReactNode
  nameKey?: string
  labelKey?: string
}

const getPayloadConfigFromPayload = (
  config: ChartConfig,
  payload: PayloadItem,
  key: string
) => {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const source: Record<string, unknown> =
    payload?.payload && typeof payload.payload === 'object'
      ? payload.payload
      : payload

  let configLabel = key

  if (key in payload && typeof payload[key] === 'string') {
    configLabel = payload[key] as string
  } else if (source && key in source && typeof source[key] === 'string') {
    configLabel = source[key] as string
  }

  return configLabel in config
    ? config[configLabel]
    : key in config
      ? config[key]
      : undefined
}

export const ChartTooltip = RechartsPrimitive.Tooltip

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === 'string'
          ? (config[label]?.label ?? label)
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className="font-medium">
            {labelFormatter(value ?? label, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className="font-medium">{value}</div>
    }, [label, labelFormatter, payload, hideLabel, labelKey, config])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot'

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-32 items-start gap-1.5 rounded-md border border-foreground/10 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color ?? item.payload?.fill ?? item.color

            return (
              <div
                key={`${item.dataKey ?? item.name ?? index}`}
                className={cn(
                  'flex w-full flex-wrap items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
                  indicator === 'dot' && 'items-center'
                )}
              >
                {formatter && item.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn('shrink-0 rounded-xs', {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-[1.5px] border-dashed bg-transparent':
                              indicator === 'dashed',
                            'my-0.5': nestLabel && indicator === 'dashed',
                          })}
                          style={
                            {
                              backgroundColor: indicatorColor,
                              borderColor: indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none',
                        nestLabel ? 'items-end' : 'items-center'
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-foreground/70">
                          {itemConfig?.label ?? item.name}
                        </span>
                      </div>
                      {item.value !== undefined && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

ChartTooltipContent.displayName = 'ChartTooltipContent'

type ChartLegendContentProps = React.ComponentProps<'div'> & {
  payload?: PayloadItem[]
  hideIcon?: boolean
  nameKey?: string
  verticalAlign?: 'top' | 'middle' | 'bottom'
}

export const ChartLegend = RechartsPrimitive.Legend

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey ?? item.dataKey ?? item.name ?? 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value?.toString()}
              className="flex items-center gap-1.5"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-foreground/70">{itemConfig?.label}</span>
            </div>
          )
        })}
      </div>
    )
  }
)

ChartLegendContent.displayName = 'ChartLegendContent'
