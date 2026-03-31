import NumberFlow from '@number-flow/react'

export interface StatisticProps {
  title: string
  value: number | string | undefined
  locales?: React.ComponentProps<typeof NumberFlow>['locales']
  format?: React.ComponentProps<typeof NumberFlow>['format']
  valueAction?: React.ReactNode
}

const parseStatisticValue = (value: number | string | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.replace(/,/g, '').trim()

  if (!normalizedValue) {
    return 0
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalizedValue)) {
    return null
  }

  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

export const Statistic = ({
  title,
  value = '0',
  locales,
  format,
  valueAction,
}: StatisticProps) => {
  const numericValue = parseStatisticValue(value)

  return (
    <div className="relative flex flex-col">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold">
          {numericValue === null ? (
            value
          ) : (
            <NumberFlow
              value={numericValue}
              locales={locales}
              format={format || { useGrouping: false }}
            />
          )}
        </div>
        <div className="shrink-0">{valueAction}</div>
      </div>
    </div>
  )
}
