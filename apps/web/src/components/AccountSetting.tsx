import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { useEffect, useState, useCallback } from 'react'
import { authClient } from '@/utils/better-auth'
import { Card } from './Card'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { Dialog } from '@openproxy/ui/Dialog'
import { Tag } from '@openproxy/ui/Tag'
import { Loader } from '@openproxy/ui/Loader'
import { Tooltip } from '@openproxy/ui/Tooltip'
import { useCountdown } from '@/hooks/useCountDown'
import { LogOutIcon } from 'lucide-react'

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
          <PhoneField />
        </div>
      </Card>

      {/* Sessions */}
      <SessionList />

      {/* Linked Accounts */}
      <AccountList />
    </div>
  )
}

// ─── Change Email ─────────────────────────────────────────────
const EmailField = () => {
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
                void toastPromise(handleChangeEmail(), {
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

// ─── Change Phone ─────────────────────────────────────────────
const PhoneField = () => {
  const { t } = useTranslation('common')
  const { session, refreshSession } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasPhone = Boolean(session?.user.phoneNumber)
  const phoneLabel = hasPhone
    ? t('account.changePhone', { defaultValue: 'Change Phone' })
    : t('account.bindPhone', { defaultValue: 'Bind Phone' })
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const {
    timeLeft,
    start: startCountdown,
    isCounting,
  } = useCountdown({
    key: 'change-phone-countdown',
    seconds: 60,
  })

  const handleSendCode = async () => {
    if (!newPhone.trim() || isCounting) return
    setCodeSending(true)
    try {
      const res = await authClient.phoneNumber.sendOtp({
        phoneNumber: newPhone,
      })
      if (res.error) {
        throw new Error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${res.error.status}`,
            status: res.error.status,
          })
        )
      }
      startCountdown()
    } finally {
      setCodeSending(false)
    }
  }

  const handleVerifyAndUpdate = async () => {
    if (!newPhone.trim() || !code.trim()) return
    setLoading(true)
    try {
      const res = await authClient.phoneNumber.verify({
        phoneNumber: newPhone,
        code,
        updatePhoneNumber: true,
      })
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
      setNewPhone('')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-sm" htmlFor="phone">
          {t('account.phone', { defaultValue: 'Phone Number' })}
        </label>
        <div className="flex items-center gap-4">
          <Input
            className="flex-1"
            name="phone"
            value={session?.user.phoneNumber || '-'}
            disabled
          />
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            {phoneLabel}
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={phoneLabel}
        width={420}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              disabled={!newPhone.trim() || !code.trim() || loading}
              onClick={() => {
                void toastPromise(handleVerifyAndUpdate(), {
                  loading: t('common.processing', {
                    defaultValue: 'Processing...',
                  }),
                  success: t('account.changePhoneSuccess', {
                    defaultValue: 'Phone number updated successfully',
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
              {t('account.verifyAndUpdate', {
                defaultValue: 'Verify & Update',
              })}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">
              {t('account.newPhone', { defaultValue: 'New Phone Number' })}
            </label>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder={t('auth.phonePlaceholder', {
                defaultValue: 'Please input phone number',
              })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">
              {t('account.verificationCode', {
                defaultValue: 'Verification Code',
              })}
            </label>
            <div className="flex items-center gap-2">
              <Input
                className="flex-1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('auth.codePlaceholder', {
                  defaultValue: 'Please input verification code',
                })}
              />
              <Button
                variant="outline"
                disabled={!newPhone.trim() || isCounting || codeSending}
                onClick={() => {
                  void toastPromise(handleSendCode(), {
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
                  })
                }}
              >
                {isCounting
                  ? t('auth.retryAfterSeconds', {
                      defaultValue: `${timeLeft}s to retry`,
                      seconds: timeLeft,
                    })
                  : t('account.sendCode', { defaultValue: 'Send Code' })}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}

// ─── Session List ─────────────────────────────────────────────
interface SessionItem {
  token: string
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
}

const SessionList = () => {
  const { t } = useTranslation('common')
  const { session } = useAuth()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authClient.listSessions()
      if (res.data) {
        setSessions(res.data as unknown as SessionItem[])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  const handleRevoke = (token: string) => {
    void toastPromise(
      authClient.revokeSession({ token }).then((res) => {
        if (res.error) throw new Error(String(res.error.status))
        return res
      }),
      {
        loading: t('common.processing', { defaultValue: 'Processing...' }),
        success: t('account.revokeSessionSuccess', {
          defaultValue: 'Session revoked',
        }),
        error: (error) =>
          error instanceof Error
            ? error.message
            : t('common.operationFailed', { defaultValue: 'Operation failed' }),
        onSuccess: () => void fetchSessions(),
      }
    )
  }

  const handleRevokeOther = () => {
    void toastPromise(
      authClient.revokeOtherSessions().then((res) => {
        if (res.error) throw new Error(String(res.error.status))
        return res
      }),
      {
        loading: t('common.processing', { defaultValue: 'Processing...' }),
        success: t('account.revokeOtherSessionsSuccess', {
          defaultValue: 'All other sessions revoked',
        }),
        error: (error) =>
          error instanceof Error
            ? error.message
            : t('common.operationFailed', { defaultValue: 'Operation failed' }),
        onSuccess: () => void fetchSessions(),
      }
    )
  }

  const currentToken = session?.session.token

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-bold">
            {t('account.sessions', { defaultValue: 'Sessions' })}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('account.sessionsDescription', {
              defaultValue: 'All active sessions for your account',
            })}
          </div>
        </div>
        {sessions.length > 1 && (
          <Button variant="outline" size="sm" onClick={handleRevokeOther}>
            {t('account.revokeOtherSessions', {
              defaultValue: 'Revoke Other Sessions',
            })}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('account.noSessions', { defaultValue: 'No sessions' })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => {
            const isCurrent = s.token === currentToken
            return (
              <div
                key={s.token}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate max-w-75">
                      {parseUserAgent(s.userAgent)}
                    </span>
                    {isCurrent && (
                      <Tag color="green">
                        {t('account.currentSession', {
                          defaultValue: 'Current',
                        })}
                      </Tag>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {s.ipAddress && <span>{s.ipAddress}</span>}
                    <span>{new Date(s.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {!isCurrent && (
                  <Tooltip
                    content={t('account.revokeSession', {
                      defaultValue: 'Revoke',
                    })}
                  >
                    <Button
                      variant="danger"
                      size="icon-xs"
                      onClick={() => handleRevoke(s.token)}
                    >
                      <LogOutIcon />
                    </Button>
                  </Tooltip>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Account List ────────────────────────────────────────────
interface AccountItem {
  id: string
  provider: string
  accountId: string
  createdAt: Date
}

const AccountList = () => {
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

function parseUserAgent(ua?: string | null): string {
  if (!ua) return 'Unknown Device'
  // Simple extraction of browser + OS
  const browserMatch = ua.match(
    /(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[/ ]([\d.]+)/i
  )
  const osMatch = ua.match(
    /(Windows NT [\d.]+|Mac OS X [\d_.]+|Linux|Android [\d.]+|iOS [\d.]+)/i
  )
  const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : ''
  const os = osMatch ? osMatch[1].replace(/_/g, '.') : ''
  return [browser, os].filter(Boolean).join(' / ') || 'Unknown Device'
}
