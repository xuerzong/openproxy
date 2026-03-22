import { useState, useEffect } from 'react'
import { authClient } from '@/utils/better-auth'
import { Card } from '../Card'
import { useTranslation } from 'react-i18next'
import { Loader } from '@openproxy/ui/Loader'

interface AccountItem {
  id: string
  provider: string
  accountId: string
  createdAt: Date
}

export const AccountList = () => {
  const { t } = useTranslation('common')
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authClient.listAccounts().then((res) => {
      if (res.data) {
        setAccounts(res.data as unknown as AccountItem[])
      }
      setLoading(false)
    })
  }, [])

  return (
    <Card>
      <div className="mb-4">
        <div className="text-lg font-bold">
          {t('account.linkedAccounts', { defaultValue: 'Linked Accounts' })}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('account.linkedAccountsDescription', {
            defaultValue: 'All login methods linked to your account',
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('account.noAccounts', { defaultValue: 'No linked accounts' })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium capitalize">
                    {account.provider}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {account.accountId}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(account.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
