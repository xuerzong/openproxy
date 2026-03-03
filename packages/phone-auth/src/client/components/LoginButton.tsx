import { cn } from '../utils/cn'
import type { ButtonHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

interface LoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const LoginButton: React.FC<LoginButtonProps> = ({
  className,
  ...restProps
}) => {
  const { t } = useTranslation('common')
  return (
    <button
      className={cn(
        'w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer outline-none select-none transition-all duration-300',
        className
      )}
      {...restProps}
    >
      {t('auth.login', { defaultValue: 'Login' })}
    </button>
  )
}
