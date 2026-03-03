import copy from 'copy-to-clipboard'
import { CopyIcon, CopyCheckIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface CopyButtonProps {
  text: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const { t } = useTranslation('common')
  const [hasCopied, setHashCopied] = useState(false)

  useEffect(() => {
    if (hasCopied) {
      setTimeout(() => {
        setHashCopied(false)
      }, 2000)
    }
  }, [hasCopied])

  return (
    <button
      className="w-4 h-4 cursor-pointer"
      onClick={() => {
        setHashCopied(true)
        copy(text)
        toast.success(t('common.copySuccess', { defaultValue: 'Copied' }))
      }}
    >
      {hasCopied ? (
        <CopyCheckIcon className="h-4 text-success" />
      ) : (
        <CopyIcon className="h-4" />
      )}
    </button>
  )
}
