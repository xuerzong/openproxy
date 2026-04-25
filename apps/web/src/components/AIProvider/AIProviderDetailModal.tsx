import { Dialog } from '@openproxy/ui/Dialog'
import { useTranslation } from 'react-i18next'
import { ModelIcon } from '@/components/ModelIcon'
import type { AIProviderItem } from '@/hooks/queries/useAIProvidersQuery'
import { AIProviderSupportedStyleTag } from '@/components/AIProvider/AIProviderSupportedStyleTag'

interface AIProviderDetailModalProps {
  provider: AIProviderItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AIProviderDetailModal: React.FC<AIProviderDetailModalProps> = ({
  provider,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation('common')

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('aiProviders.detailTitle', {
        defaultValue: 'AI Provider Detail',
      })}
      width={760}
    >
      {provider && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <ModelIcon model={provider.id} />
            <div>
              <div className="font-medium">{provider.name}</div>
              <div className="text-muted-foreground">{provider.id}</div>
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2">
            <div className="text-muted-foreground">ID</div>
            <div className="break-all">{provider.id}</div>

            <div className="text-muted-foreground">
              {t('common.name', { defaultValue: 'Name' })}
            </div>
            <div>{provider.name}</div>

            <div className="text-muted-foreground">
              {t('aiProviders.baseUrl', { defaultValue: 'Base URL' })}
            </div>
            <div className="break-all">{provider.baseUrl}</div>

            <div className="text-muted-foreground">
              {t('aiProviders.docsUrl', { defaultValue: 'Docs URL' })}
            </div>
            <div className="break-all">
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {provider.docsUrl}
              </a>
            </div>

            <div className="text-muted-foreground">
              {t('aiProviders.supportedStyles', {
                defaultValue: 'Supported Styles',
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              {provider.supportedStyles?.length
                ? provider.supportedStyles.map((style) => (
                    <AIProviderSupportedStyleTag key={style} style={style} />
                  ))
                : '-'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground">
              {t('aiProviders.styleBaseUrls', {
                defaultValue: 'Style Base URLs',
              })}
            </div>
            {provider.baseUrls?.length ? (
              <div className="space-y-2 rounded-md border border-border p-3">
                {provider.baseUrls.map((item) => (
                  <div
                    key={`${provider.id}-${item.style}`}
                    className="space-y-1"
                  >
                    <AIProviderSupportedStyleTag style={item.style} />
                    <div className="break-all text-muted-foreground">
                      {item.baseUrl}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">-</div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
