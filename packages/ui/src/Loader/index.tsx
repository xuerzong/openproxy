import { Loader2Icon } from 'lucide-react'
import { cn } from '../utils/cn'
import s from './index.module.scss'

export interface LoaderProps {
  className?: string
}

export const Loader: React.FC<LoaderProps> = ({ className }) => {
  return (
    <Loader2Icon className={cn(s.Loader, 'w-5 h-5 text-current', className)} />
  )
}
