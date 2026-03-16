import NumberFlow from '@number-flow/react'

interface StatisticProps {
  title: string
  value: number | string | undefined
  valueAction?: React.ReactNode
}

export const Statistic = ({
  title,
  value = '0',
  valueAction,
}: StatisticProps) => {
  return (
    <div className="relative flex flex-col">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold">
          <NumberFlow
            value={typeof value === 'string' ? parseFloat(value) : value}
            format={{ useGrouping: false }}
          />
        </div>
        <div className="shrink-0">{valueAction}</div>
      </div>
    </div>
  )
}
