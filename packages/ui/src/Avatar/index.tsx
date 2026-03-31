import { UserIcon } from 'lucide-react'

export interface AvatarProps {
  src?: string | null
  className?: string
  iconClassName?: string
}

export const Avatar = ({
  src,
  className = 'w-8 h-8',
  iconClassName = 'w-4 h-4',
}: AvatarProps) => {
  if (src) {
    return <img className={`${className} rounded-full`} src={src} />
  }

  return (
    <div
      className={`${className} rounded-full bg-muted flex items-center justify-center`}
    >
      <UserIcon className={`${iconClassName} text-muted-foreground`} />
    </div>
  )
}
