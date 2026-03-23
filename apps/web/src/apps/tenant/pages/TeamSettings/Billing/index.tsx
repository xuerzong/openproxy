import { useState } from 'react'
import { CheckIcon, CrownIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { Button } from '@openproxy/ui/Button'
import { Tag } from '@openproxy/ui/Tag'
import { useRequest } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { useTeamMembersQuery } from '@/apps/tenant/hooks/queries/useTeamMembersQuery'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'
import { useIsOSS } from '@/hooks/useIsOSS'
import { NotFoundView } from '@/components/NotFoundView'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const teamQuery = useTeamQuery()
  const teamMembersQuery = useTeamMembersQuery()
  const constsQuery = useConstsQuery()
  const isOSS = useIsOSS()
  const [upgradingPlan, setUpgradingPlan] = useState(false)

  const team = teamQuery.data?.team
  const members = teamMembersQuery.data || []
  const currentUserId = session?.user.id
  const currentMember = members.find(
    (member) => member.userId === currentUserId
  )
  const isOwner = currentMember?.role === 'owner'
  const teamPlanLimits = constsQuery.data?.teamPlanLimits
  const currentPlan = team?.plan || 'free'
  const isPro = currentPlan === 'pro'

  const onUpgradePlan = async (plan: 'free' | 'pro') => {
    if (upgradingPlan) return

    setUpgradingPlan(true)

    void toastApiPromise(request.team.plan.put({ plan }), {
      loading: t('common.processing', {
        defaultValue: 'Processing...',
      }),
      success: t('teamSettings.plan.upgradeSuccess', {
        defaultValue: 'Plan updated successfully',
      }),
      error: (error) =>
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
          status: getToastRequestStatus(error),
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [queryKeys.team] })
      },
    }).finally(() => {
      setUpgradingPlan(false)
    })
  }

  if (isOSS || !teamPlanLimits) {
    return <NotFoundView />
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-6">
        <div>
          <div className="text-lg font-semibold flex items-center gap-2">
            {t('teamSettings.plan.title', { defaultValue: 'Team Plan' })}
            <Tag color={isPro ? 'green' : 'default'}>
              {isPro
                ? t('common.pro', { defaultValue: 'Pro' })
                : t('common.free', { defaultValue: 'Free' })}
            </Tag>
          </div>
          <div className="text-sm text-primary/75 mt-1">
            {t('teamSettings.plan.description', {
              defaultValue:
                'Upgrade to Pro to unlock more members and API key slots.',
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['free', 'pro'] as const).map((plan) => {
            const limits = teamPlanLimits[plan]
            const isActive = currentPlan === plan
            return (
              <div
                key={plan}
                className={`rounded-lg border p-5 flex flex-col gap-4 ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan === 'pro' && (
                      <CrownIcon className="w-4 h-4 text-primary" />
                    )}
                    <span className="font-semibold text-base uppercase">
                      {plan === 'pro'
                        ? t('common.pro', { defaultValue: 'Pro' })
                        : t('common.free', { defaultValue: 'Free' })}
                    </span>
                  </div>
                  {isActive && (
                    <Tag color="green">
                      {t('teamSettings.plan.current', {
                        defaultValue: 'Current',
                      })}
                    </Tag>
                  )}
                </div>

                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500 shrink-0" />
                    {t('teamSettings.plan.membersLimit', {
                      defaultValue: '{{count}} members',
                      count: limits.usersLimit,
                    })}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500 shrink-0" />
                    {t('teamSettings.plan.apiKeysLimit', {
                      defaultValue: '{{count}} API keys',
                      count: limits.apiKeyLimit,
                    })}
                  </li>
                </ul>

                {isOwner && !isActive && (
                  <Button
                    loading={upgradingPlan}
                    onClick={() => onUpgradePlan(plan)}
                    variant={plan === 'pro' ? 'default' : 'outline'}
                  >
                    {plan === 'pro'
                      ? t('teamSettings.plan.upgrade', {
                          defaultValue: 'Upgrade to Pro',
                        })
                      : t('teamSettings.plan.downgrade', {
                          defaultValue: 'Downgrade to Free',
                        })}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default Page
