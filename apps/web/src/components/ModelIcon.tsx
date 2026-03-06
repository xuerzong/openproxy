import { cn } from '@/utils/cn'
import { BoxIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ModelIconProps {
  model: string
  className?: string
}

const getModelIcon = (model: string) => {
  const icons: Record<string, string> = {
    alibaba: 'qwen',
    meituan: 'longcat',
    amazon: 'bedrock',
    xiaomi: 'xiaomimimo',
    moonshotai: 'moonshot',
    'arcee-ai': 'arcee',
  }

  return icons[model] || model
}

export const ModelIcon: React.FC<ModelIconProps> = ({ model, className }) => {
  const modelOwnedBy = model ? model.split('/')[0] : ''
  const [error, setError] = useState(false)
  useEffect(() => {
    setError(false)
  }, [modelOwnedBy])

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-6 h-6 text-primary border border-border rounded-full',
          className
        )}
      >
        <BoxIcon className="w-4 h-4" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-6 h-6 border border-border rounded-full bg-muted">
      <img
        className={cn('w-4 h-4', className)}
        src={`/images/icons/${getModelIcon(modelOwnedBy)}.svg`}
        onError={(e) => {
          setError(true)
        }}
      />
    </div>
  )
}
