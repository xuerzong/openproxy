import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { useState } from 'react'
import { authClient } from '@/utils/better-auth'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { Dialog } from '@openproxy/ui/Dialog'

export const EmailField = () => {
  const { t } = useTranslation('common')
  const { session, refreshSession } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasEmail = Boolean(session?.user.email)
  const emailLabel = hasEmail
    ? t('account.changeEmail', { defaultValue: 'Change Email' })
    : t('account.bindEmail', { defaultValue: 'Bind Email' })
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return
    setLoading(true)
    try {
      const res = await authClient.changeEmail({ newEmail })
      if (res.error) {
        throw new Error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${res.error.status}`,
            status: res.error.status,
          })
        )
      }
      await refreshSession()
      setDialogOpen(false)
      setNewEmail('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-sm" htmlFor="email">
          {t('account.email', { defaultValue: 'Email' })}
        </label>
        <div className="flex items-center gap-4">
          <Input
            className="flex-1"
            name="email"
            value={session?.user.email || '-'}
            placeholder={t('account.unbound', {
              defaultValue: 'Not bound yet',
            })}
            disabled
          />
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            {emailLabel}
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={emailLabel}
        width={420}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              disabled={!newEmail.trim() || loading}
              onClick={() => {
                toastPromise(handleChangeEmail(), {
                  loading: t('common.processing', {
                    defaultValue: 'Processing...',
                  }),
                  success: t('account.changeEmailSuccess', {
                    defaultValue:
                      'Verification email sent, please check your inbox',
                  }),
                  error: (error) =>
                    error instanceof Error
                      ? error.message
                      : t('common.operationFailed', {
                          defaultValue: 'Operation failed',
                        }),
                })
              }}
            >
              {t('actions.confirm', { defaultValue: 'Confirm' })}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm">
            {t('account.newEmail', { defaultValue: 'New Email Address' })}
          </label>
          <Input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="example@email.com"
            type="email"
          />
        </div>
      </Dialog>
    </>
  )
}
