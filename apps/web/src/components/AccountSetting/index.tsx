import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { useEffect, useState } from 'react'
import { authClient } from '@/utils/better-auth'
import { Card } from '../Card'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { isOSS } from '@/utils/env'
import { EmailField } from './EmailField'
import { PhoneField } from './PhoneField'
import { SessionList } from './SessionList'
import { AccountList } from './AccountList'

export const AccountSetting = () => {
  const { t } = useTranslation('common')
  const { session, refreshSession } = useAuth()
  const [name, setName] = useState('')
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
                  void toastPromise(
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
                        void refreshSession()
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
          {isOSS && <PhoneField />}
        </div>
      </Card>

      {/* Sessions */}
      <SessionList />

      {/* Linked Accounts */}
      <AccountList />
    </div>
  )
}
