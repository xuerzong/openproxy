import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@openproxy/ui/Button'
import { useState, useCallback, useEffect } from 'react'
import { authClient } from '@/utils/better-auth'
import { Card } from '../Card'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { Tag } from '@openproxy/ui/Tag'
import { Loader } from '@openproxy/ui/Loader'
import { Tooltip } from '@openproxy/ui/Tooltip'
import { LogOutIcon } from 'lucide-react'
import { parseUserAgent } from './parseUserAgent'

interface SessionItem {
  token: string
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
}

export const SessionList = () => {
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
