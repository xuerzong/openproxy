import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { useEffect, useState } from 'react'
import { authClient } from '@/utils/better-auth'
import { Card } from '../Card'
import { AvatarPicker } from '../AvatarPicker'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { useIsOSS } from '@/hooks/useIsOSS'
import { EmailField } from './EmailField'
import { PhoneField } from './PhoneField'
import { PasswordField } from './PasswordField'
import { SessionList } from './SessionList'
import { AccountList } from './AccountList'
import { parseAvatarOptions } from '@/utils/avatar'
import { Avatar } from '@openproxy/ui/Avatar'

export const AccountSetting = () => {
  const { t } = useTranslation('common')
  const { session, refreshSession } = useAuth()
  const [name, setName] = useState('')
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)
  const isOSS = useIsOSS()
  const sessionUserName = session?.user.name || ''

  useEffect(() => {
    setName(sessionUserName)
  }, [sessionUserName])

  return (
    <div className="flex flex-col gap-6">
      {/* Basic Info */}
      <Card>
        <div className="text-lg font-bold mb-4">
          {t('account.basicInfo', { defaultValue: 'Basic Information' })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              {t('avatar.label', { defaultValue: 'Avatar' })}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setAvatarPickerOpen(true)}
              >
                <Avatar
                  src={session?.user.image}
                  className="w-12 h-12 border border-border"
                  iconClassName="w-6 h-6"
                />
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAvatarPickerOpen(true)}
              >
                {t('avatar.change', { defaultValue: 'Change' })}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm" htmlFor="id">
              ID
            </label>
            <Input
              className="w-full"
              name="id"
              value={session?.user.id}
              disabled
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm" htmlFor="name">
              {t('common.name', { defaultValue: 'Name' })}
            </label>
            <div className="flex items-center gap-4">
              <Input
                className="w-full"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                disabled={sessionUserName === name}
                onClick={() => {
                  toastPromise(
                    authClient.updateUser({ name }).then((res) => {
                      if (res.error) {
                        throw new Error(
                          t('common.operationFailedWithStatus', {
                            defaultValue: `Operation failed: ${res.error.status}`,
                            status: res.error.status,
                          })
                        )
                      }
                      return res
                    }),
                    {
                      loading: t('common.processing', {
                        defaultValue: 'Processing...',
                      }),
                      success: t('common.operationSuccess', {
                        defaultValue: 'Success',
                      }),
                      error: (error) =>
                        error instanceof Error
                          ? error.message
                          : t('common.operationFailed', {
                              defaultValue: 'Operation failed',
                            }),
                      onSuccess: () => {
                        refreshSession()
                      },
                    }
                  )
                }}
              >
                {t('account.saveName', { defaultValue: 'Save Name' })}
              </Button>
            </div>
          </div>

          <EmailField />
          {!isOSS && <PhoneField />}
          <PasswordField />
        </div>
      </Card>

      {/* Sessions */}
      <SessionList />

      {/* Linked Accounts */}
      <AccountList />

      <AvatarPicker
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        defaultSeed={session?.user.id || ''}
        defaultOptions={
          session?.user.image
            ? parseAvatarOptions(session.user.image)
            : undefined
        }
        onConfirm={(url) => {
          toastPromise(
            authClient.updateUser({ image: url }).then((res) => {
              if (res.error) {
                throw new Error(
                  t('common.operationFailedWithStatus', {
                    defaultValue: `Operation failed: ${res.error.status}`,
                    status: res.error.status,
                  })
                )
              }
              return res
            }),
            {
              loading: t('common.processing', {
                defaultValue: 'Processing...',
              }),
              success: t('common.operationSuccess', {
                defaultValue: 'Success',
              }),
              error: (error) =>
                error instanceof Error
                  ? error.message
                  : t('common.operationFailed', {
                      defaultValue: 'Operation failed',
                    }),
              onSuccess: () => {
                refreshSession()
              },
            }
          )
        }}
      />
    </div>
  )
}
