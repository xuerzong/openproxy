import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PlusIcon, TrashIcon, AlertTriangleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import dayjs from '@openproxy/utils/dayjs'
import { Card } from '@/components/Card'
import { CopyButton } from '@/components/CopyButton'
import { Loader } from '@openproxy/ui/Loader'
import { Button } from '@openproxy/ui/Button'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { Tag } from '@openproxy/ui/Tag'
import { CheckboxGroup } from '@openproxy/ui/Checkbox'
import { DatePicker } from '@openproxy/ui/DatePicker'
import { useRequest } from '@/contexts/ApiContext'
import { useAccessTokensQuery } from '@/apps/tenant/hooks/queries/useAccessTokensQuery'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import { queryKeys } from '@/constants/query-keys'

const SCOPES = ['api_keys:read', 'api_keys:write', 'balance:read'] as const
const MAX_ACCESS_TOKENS = 20

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const queryClient = useQueryClient()
  const accessTokensQuery = useAccessTokensQuery()
  const tokens = accessTokensQuery.data || []
  const loading = accessTokensQuery.isLoading

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const scopeOptions = SCOPES.map((scope) => ({
    value: scope,
    label: t(`teamSettings.accessTokens.scopeLabels.${scope}`, {
      defaultValue: scope,
    }),
  }))

  const resetCreateForm = () => {
    setName('')
    setScopes([])
    setExpiresAt(null)
  }

  const onOpenCreateDialog = () => {
    resetCreateForm()
    setCreateOpen(true)
  }

  const onCloseCreateDialog = () => {
    setCreateOpen(false)
    resetCreateForm()
  }

  const onCreate = async () => {
    if (creating || !name.trim() || scopes.length === 0) return

    setCreating(true)

    toastApiPromise(
      request.accessTokens.post({
        name: name.trim(),
        scopes: scopes as any,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }),
      {
        loading: t('common.processing', { defaultValue: 'Processing...' }),
        success: t('teamSettings.accessTokens.messages.createSuccess', {
          defaultValue: 'Access token created successfully',
        }),
        error: (error) =>
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
            status: getToastRequestStatus(error),
          }),
        onSuccess: (data) => {
          queryClient.invalidateQueries({
            queryKey: [queryKeys.accessTokens],
          })
          setCreateOpen(false)
          resetCreateForm()
          if (data && typeof data === 'object' && 'token' in data) {
            setCreatedToken((data as { token: string }).token)
          }
        },
      }
    ).finally(() => {
      setCreating(false)
    })
  }

  const onDelete = async () => {
    if (!deleteId || deleting) return

    setDeleting(true)

    toastApiPromise(request.accessTokens({ id: deleteId }).delete(), {
      loading: t('common.processing', { defaultValue: 'Processing...' }),
      success: t('teamSettings.accessTokens.messages.deleteSuccess', {
        defaultValue: 'Access token deleted successfully',
      }),
      error: (error) =>
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
          status: getToastRequestStatus(error),
        }),
      onSuccess: () => {
        setDeleteId(null)
        queryClient.invalidateQueries({
          queryKey: [queryKeys.accessTokens],
        })
      },
    }).finally(() => {
      setDeleting(false)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">
              {t('teamSettings.accessTokens.title', {
                defaultValue: 'Access Tokens',
              })}
            </div>
            <div className="text-sm text-primary/75 mt-1">
              {t('teamSettings.accessTokens.description', {
                defaultValue:
                  'Manage access tokens for programmatic team management via OpenAPI.',
              })}
            </div>
          </div>
          <div className="shrink-0">
            <Button
              onClick={onOpenCreateDialog}
              disabled={tokens.length >= MAX_ACCESS_TOKENS}
              title={
                tokens.length >= MAX_ACCESS_TOKENS
                  ? t('teamSettings.accessTokens.messages.limitReached', {
                      defaultValue: `Maximum ${MAX_ACCESS_TOKENS} tokens per team`,
                      count: MAX_ACCESS_TOKENS,
                    })
                  : undefined
              }
            >
              <PlusIcon className="w-4 h-4" />
              {t('actions.create', { defaultValue: 'Create' })}
              {!loading && (
                <span className="text-xs opacity-75">
                  ({tokens.length}/{MAX_ACCESS_TOKENS})
                </span>
              )}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-80 items-center justify-center text-primary">
            <Loader />
          </div>
        )}

        {!loading && tokens.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            {t('common.emptyState', { defaultValue: 'Nothing here yet' })}
          </div>
        )}

        {!loading &&
          tokens.map((token, index) => (
            <div key={token.id}>
              {index > 0 && <div className="h-px bg-border" />}
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{token.name}</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                      {token.token}
                    </code>
                    {token.expiresAt &&
                    dayjs(token.expiresAt).isBefore(dayjs()) ? (
                      <Tag color="yellow">
                        {t('teamSettings.accessTokens.expired', {
                          defaultValue: 'Expired',
                        })}
                      </Tag>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(token.scopes as string[]).map((scope: string) => (
                      <Tag key={scope} color="default">
                        {t(`teamSettings.accessTokens.scopeLabels.${scope}`, {
                          defaultValue: scope,
                        })}
                      </Tag>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {t('teamSettings.accessTokens.table.createdAt', {
                        defaultValue: 'Created At',
                      })}
                      : {dayjs(token.createdAt).format('YYYY/MM/DD HH:mm')}
                    </span>
                    <span>
                      {t('teamSettings.accessTokens.table.expiresAt', {
                        defaultValue: 'Expires At',
                      })}
                      :{' '}
                      {token.expiresAt
                        ? dayjs(token.expiresAt).format('YYYY/MM/DD HH:mm')
                        : t('teamSettings.accessTokens.table.noExpiration', {
                            defaultValue: 'No expiration',
                          })}
                    </span>
                    <span>
                      {t('teamSettings.accessTokens.table.lastUsedAt', {
                        defaultValue: 'Last Used',
                      })}
                      :{' '}
                      {token.lastUsedAt
                        ? dayjs(token.lastUsedAt).format('YYYY/MM/DD HH:mm')
                        : t('teamSettings.accessTokens.table.never', {
                            defaultValue: 'Never',
                          })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="icon-xs"
                  className="shrink-0"
                  aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                  title={t('actions.delete', { defaultValue: 'Delete' })}
                  onClick={() => setDeleteId(token.id)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
          ))}
      </Card>

      <Dialog
        title={t('teamSettings.accessTokens.createTitle', {
          defaultValue: 'Create Access Token',
        })}
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) onCloseCreateDialog()
        }}
        footer={
          <DialogFooter
            okText={t('actions.create', { defaultValue: 'Create' })}
            locale={{
              cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
              confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
            }}
            okButtonProps={{
              loading: creating,
              disabled: !name.trim() || scopes.length === 0,
            }}
            onCancel={onCloseCreateDialog}
            onOk={onCreate}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              {t('teamSettings.accessTokens.name', {
                defaultValue: 'Token Name',
              })}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teamSettings.accessTokens.namePlaceholder', {
                defaultValue: 'e.g. CI/CD Token',
              })}
              maxLength={64}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              {t('teamSettings.accessTokens.scopes', {
                defaultValue: 'Permissions',
              })}
            </label>
            <CheckboxGroup
              value={scopes}
              onChange={(val) => setScopes(val || [])}
              options={scopeOptions}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              {t('teamSettings.accessTokens.expiresAt', {
                defaultValue: 'Expiration Date',
              })}
            </label>
            <DatePicker
              value={expiresAt ?? undefined}
              onChange={(date) => setExpiresAt(date ?? null)}
              placeholder={t('teamSettings.accessTokens.noExpiration', {
                defaultValue: 'No expiration',
              })}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        title={t('teamSettings.accessTokens.confirmDelete.title', {
          defaultValue: 'Delete this access token?',
        })}
        description={t('teamSettings.accessTokens.confirmDelete.description', {
          defaultValue:
            'Applications using this token will no longer have access.',
        })}
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        footer={
          <DialogFooter
            okText={t('actions.delete', { defaultValue: 'Delete' })}
            locale={{
              cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
              confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
            }}
            okButtonProps={{
              variant: 'danger',
              loading: deleting,
            }}
            onCancel={() => setDeleteId(null)}
            onOk={onDelete}
          />
        }
      />

      <Dialog
        title={t('teamSettings.accessTokens.messages.createSuccess', {
          defaultValue: 'Access token created successfully',
        })}
        open={Boolean(createdToken)}
        onOpenChange={(open) => {
          if (!open) setCreatedToken(null)
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {t('teamSettings.accessTokens.messages.copyWarning', {
              defaultValue:
                'Please copy the token now. You will not be able to see it again.',
            })}
          </div>
          <Input
            value={createdToken || ''}
            readOnly
            className="w-full font-mono text-sm"
            suffix={<CopyButton text={createdToken || ''} />}
          />
        </div>
      </Dialog>
    </div>
  )
}

export default Page
