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
          'flex items-center justify-center w-4 h-4 text-primary border border-border rounded-full',
          className
        )}
      >
        <BoxIcon className="w-3 h-3" />
      </div>
    )
  }
  return (
    <img
      className={cn('w-4 h-4', className)}
      src={`/images/model/${getModelIcon(modelOwnedBy)}.svg`}
      onError={(e) => {
        setError(true)
      }}
    />
  )
}
