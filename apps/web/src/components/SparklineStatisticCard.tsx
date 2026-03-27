import { Card } from '@/components/Card'

interface SparklineStatisticCardProps {
  title: string
  value: number | string
  chart: React.ReactNode
}

export const SparklineStatisticCard: React.FC<SparklineStatisticCardProps> = ({
  title,
  value,
  chart,
}) => {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-sm font-medium">{title}</div>
          <div className="text-3xl font-bold tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </div>
        <div className="w-36 shrink-0">{chart}</div>
      </div>
    </Card>
  )
}
