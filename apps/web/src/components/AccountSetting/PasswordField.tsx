import { useState, useEffect } from 'react'
import { Button } from '@openproxy/ui/Button'
import { Input } from '@openproxy/ui/Input'
import { authClient } from '@/utils/better-auth'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { Dialog } from '@openproxy/ui/Dialog'

export const PasswordField = () => {
  const { t } = useTranslation('common')
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    authClient.listAccounts().then((res) => {
      if (res.data) {
        setHasPassword(res.data.some((a) => a.providerId === 'credential'))
      }
      setLoading(false)
    })
  }, [])

  const passwordLabel = hasPassword
    ? t('account.changePassword', { defaultValue: 'Change Password' })
    : t('account.setPassword', { defaultValue: 'Set Password' })

  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium text-sm">
        {t('account.password', { defaultValue: 'Password' })}
      </label>
      <div className="flex items-center gap-4">
        <Input
          className="flex-1"
          value={hasPassword ? '••••••••' : '-'}
          disabled
        />
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setDialogOpen(true)}
        >
          {passwordLabel}
        </Button>
      </div>

      {hasPassword ? (
        <ChangePasswordDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={passwordLabel}
        />
      ) : (
        <SetPasswordDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={passwordLabel}
          onSuccess={() => setHasPassword(true)}
        />
      )}
    </div>
  )
}

const ChangePasswordDialog = ({
  open,
  onOpenChange,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
}) => {
  const { t } = useTranslation('common')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    setLoading(true)
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })
      if (res.error) {
        throw new Error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${res.error.status}`,
            status: res.error.status,
          })
        )
      }
      onOpenChange(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    currentPassword.trim() &&
    newPassword.trim() &&
    newPassword === confirmPassword &&
    !loading

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      width={420}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              void toastPromise(handleChangePassword(), {
                loading: t('common.processing', {
                  defaultValue: 'Processing...',
                }),
                success: t('account.changePasswordSuccess', {
                  defaultValue: 'Password changed successfully',
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm">
            {t('account.currentPassword', {
              defaultValue: 'Current Password',
            })}
          </label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t('account.currentPasswordPlaceholder', {
              defaultValue: 'Enter current password',
            })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm">
            {t('account.newPassword', { defaultValue: 'New Password' })}
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('account.newPasswordPlaceholder', {
              defaultValue: 'Enter new password',
            })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm">
            {t('account.confirmPassword', {
              defaultValue: 'Confirm Password',
            })}
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('account.confirmPasswordPlaceholder', {
              defaultValue: 'Enter new password again',
            })}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <span className="text-xs text-destructive">
              {t('account.passwordMismatch', {
                defaultValue: 'Passwords do not match',
              })}
            </span>
          )}
        </div>
      </div>
    </Dialog>
  )
}

const SetPasswordDialog = ({
  open,
  onOpenChange,
  title,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSuccess: () => void
}) => {
  const { t } = useTranslation('common')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetPassword = async () => {
    if (!newPassword) return
    setLoading(true)
    try {
      const res = await authClient.$fetch<{ status: boolean }>(
        '/set-password',
        {
          method: 'POST',
          body: { newPassword },
        }
      )
      if (res.error) {
        throw new Error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${res.error.status}`,
            status: res.error.status,
          })
        )
      }
      onSuccess()
      onOpenChange(false)
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    newPassword.trim() && newPassword === confirmPassword && !loading

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      width={420}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              void toastPromise(handleSetPassword(), {
                loading: t('common.processing', {
                  defaultValue: 'Processing...',
                }),
                success: t('account.setPasswordSuccess', {
                  defaultValue: 'Password set successfully',
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm">
            {t('account.newPassword', { defaultValue: 'New Password' })}
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('account.newPasswordPlaceholder', {
              defaultValue: 'Enter new password',
            })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm">
            {t('account.confirmPassword', {
              defaultValue: 'Confirm Password',
            })}
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('account.confirmPasswordPlaceholder', {
              defaultValue: 'Enter new password again',
            })}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <span className="text-xs text-destructive">
              {t('account.passwordMismatch', {
                defaultValue: 'Passwords do not match',
              })}
            </span>
          )}
        </div>
      </div>
    </Dialog>
  )
}
