import { useState, useEffect, useCallback } from 'react'
import { authClient } from '@/utils/better-auth'
import { Card } from '../Card'
import { useTranslation } from 'react-i18next'
import { Loader } from '@openproxy/ui/Loader'
import { Button } from '@openproxy/ui/Button'
import { GithubIcon } from '../GithubIcon'
import { GoogleIcon } from '../GoogleIcon'
import { useLoginMethodsQuery } from '@/hooks/queries/useLoginMethodsQuery'
import { toast } from 'sonner'

interface AccountItem {
  id: string
  providerId?: string
  provider?: string
  accountId: string
  createdAt: Date
}

const providerConfig = {
  github: {
    icon: <GithubIcon className="w-5 h-5" />,
    label: 'GitHub',
  },
  google: {
    icon: <GoogleIcon className="w-5 h-5" />,
    label: 'Google',
  },
} as const

type SocialProvider = keyof typeof providerConfig

const allProviders: SocialProvider[] = ['github', 'google']

const getAccountProvider = (account: AccountItem): string => {
  return account.providerId || account.provider || ''
}

export const AccountList = () => {
  const { t } = useTranslation('common')
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const loginMethodsQuery = useLoginMethodsQuery()
  const loginMethods = loginMethodsQuery.data

  const availableProviders = allProviders.filter((p) => loginMethods?.[p])

  const fetchAccounts = useCallback(() => {
    authClient.listAccounts().then((res) => {
      if (res.data) {
        setAccounts(res.data as unknown as AccountItem[])
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  if (!loading && availableProviders.length === 0) {
    return null
  }

  const linkedProviders = new Set(accounts.map(getAccountProvider))

  const handleLink = (provider: SocialProvider) => {
    authClient.linkSocial({
      provider,
      callbackURL: window.location.href,
    })
  }

  const handleUnlink = async (provider: SocialProvider) => {
    const account = accounts.find((a) => getAccountProvider(a) === provider)
    if (!account) return

    if (accounts.length <= 1) {
      toast.error(
        t('account.cannotUnlinkLast', {
          defaultValue: 'Cannot unlink the only login method',
        })
      )
      return
    }

    const res = await authClient.unlinkAccount({
      providerId: provider,
    })

    if (res.error) {
      toast.error(
        t('common.operationFailed', { defaultValue: 'Operation failed' })
      )
      return
    }

    toast.success(
      t('account.unlinkSuccess', {
        defaultValue: 'Account unlinked successfully',
      })
    )
    fetchAccounts()
  }

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
      ) : (
        <div className="flex flex-col gap-3">
          {availableProviders.map((provider) => {
            const config = providerConfig[provider]
            const linked = linkedProviders.has(provider)
            const account = accounts.find(
              (a) => getAccountProvider(a) === provider
            )

            return (
              <div
                key={provider}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {config.icon}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{config.label}</span>
                    {linked && account && (
                      <span className="text-xs text-muted-foreground">
                        {account.accountId}
                      </span>
                    )}
                  </div>
                </div>
                {linked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlink(provider)}
                  >
                    {t('account.unlink', { defaultValue: 'Unlink' })}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleLink(provider)}>
                    {t('account.link', { defaultValue: 'Link' })}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
