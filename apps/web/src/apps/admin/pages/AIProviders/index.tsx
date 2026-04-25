import { useState } from 'react'
import { MoreHorizontalIcon, KeyRoundIcon, InfoIcon } from 'lucide-react'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@openproxy/ui/Button'
import { Table } from '@openproxy/ui/Table'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { DropdownMenu } from '@openproxy/ui/DropdownMenu'
import { AIProviderAPIKeys } from '@/components/AIProvider/AIProviderAPIKeys'
import { AIProviderDetailModal } from '@/components/AIProvider/AIProviderDetailModal'
import { AIProviderSupportedStyleTag } from '@/components/AIProvider/AIProviderSupportedStyleTag'
import { useTranslation } from 'react-i18next'
import { ModelIcon } from '@/components/ModelIcon'
import { Tag } from '@openproxy/ui'

const Page = () => {
  const { t } = useTranslation('common')
  const aiProvidersQuery = useAIProvidersQuery()
  const [manageAPIKeysProviderId, setManageAPIKeysProviderId] = useState('')
  const [detailProviderId, setDetailProviderId] = useState('')

  const manageAPIKeysProvider =
    aiProvidersQuery.data?.find(
      (provider) => provider.id === manageAPIKeysProviderId
    ) || null

  const detailProvider =
    aiProvidersQuery.data?.find(
      (provider) => provider.id === detailProviderId
    ) || null

  return (
    <PageContainer
      title={t('aiProviders.title', { defaultValue: 'AI Providers' })}
      className="h-screen"
    >
      <FlexScrollViewer bordered>
        <Table
          rowKey={(d: any) => d.id}
          loading={aiProvidersQuery.isLoading}
          data={aiProvidersQuery.data || []}
          columns={[
            {
              key: 'name',
              label: t('common.name', { defaultValue: 'Name' }),
              width: 240,
              fixed: 'left',
              render: (_, record) => {
                return (
                  <div className="flex items-center gap-1">
                    <ModelIcon model={record.id} />
                    <div className="min-w-0">{record.name}</div>
                  </div>
                )
              },
            },
            {
              key: 'supportedStyles',
              label: t('aiProviders.supportedStyles', {
                defaultValue: 'Supported Styles',
              }),
              width: 200,
              ellipsis: true,
              render: (text) => (
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(text) && text.length
                    ? text.map((s) => (
                        <AIProviderSupportedStyleTag key={s} style={s} />
                      ))
                    : '-'}
                </div>
              ),
            },
            {
              key: 'apiKey',
              width: 120,
              label: t('aiProviders.apiKeys', { defaultValue: 'API Keys' }),
              render: (_, record) => {
                if (!record.apiKeys?.length) {
                  return '-'
                }

                return <Tag color="gray">{record.apiKeys.length}</Tag>
              },
            },
            {
              key: 'operation',
              label: t('common.operation', { defaultValue: 'Operation' }),
              width: 80,
              fixed: 'right',
              render: (_, record) => {
                return (
                  <div>
                    <DropdownMenu
                      menus={[
                        {
                          type: 'item',
                          key: 'detail',
                          label: t('aiProviders.detail', {
                            defaultValue: 'Detail',
                          }),
                          icon: <InfoIcon />,
                          onClick: () => {
                            setDetailProviderId(record.id)
                          },
                        },
                        {
                          type: 'item',
                          key: 'manageAPIKeys',
                          label: t('aiProviders.manageApiKeys', {
                            defaultValue: 'AI Keys',
                          }),
                          icon: <KeyRoundIcon />,
                          onClick: () => {
                            setManageAPIKeysProviderId(record.id)
                          },
                        },
                      ]}
                    >
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenu>
                  </div>
                )
              },
            },
          ]}
          locale={{
            noData: t('common.noData', { defaultValue: 'No data' }),
            emptyListHint: t('common.emptyListHint', {
              defaultValue: 'No records yet',
            }),
          }}
        />
      </FlexScrollViewer>

      <AIProviderAPIKeys
        provider={manageAPIKeysProvider}
        open={Boolean(manageAPIKeysProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setManageAPIKeysProviderId('')
          }
        }}
        onSuccess={() => {
          aiProvidersQuery.refetch()
        }}
      />

      <AIProviderDetailModal
        provider={detailProvider}
        open={Boolean(detailProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailProviderId('')
          }
        }}
      />
    </PageContainer>
  )
}

export default Page
