import dayjs from '@/utils/dayjs'
import {
  AlarmClockOffIcon,
  MoreVerticalIcon,
  SquarePenIcon,
  TrashIcon,
  ZapIcon,
} from 'lucide-react'
import { DropdownMenu } from '../ui/DropdownMenu'
import { useTranslation } from 'react-i18next'

interface APIKeyItemProps {
  apiKey: any
  onEdit: () => void
  onDelete: () => void
}

export const APIKeyItem: React.FC<APIKeyItemProps> = ({
  apiKey,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation('common')
  return (
    <div className="flex flex-col gap-2 p-4 hover:bg-muted">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="text-lg">{apiKey.name}</div>
            {apiKey.expiresAt && dayjs(apiKey.expiresAt).isBefore(dayjs()) && (
              <div className="flex items-center gap-1 text-xs py-0.5 px-2 bg-yellow-100 text-yellow-600">
                <AlarmClockOffIcon className="w-3 h-3" />
                <span>{t('common.expired', { defaultValue: 'Expired' })}</span>
              </div>
            )}
          </div>
          <div className="text-sm">{apiKey.apiKey}</div>
        </div>

        <div className="flex items-center gap-1 text-sm ml-auto">
          <ZapIcon className="text-green-500 w-4 h-4" />
          <span>{dayjs(apiKey.lastUsedAt).fromNow()}</span>
        </div>

        <div className="">
          <DropdownMenu
            menus={[
              {
                key: 'edit',
                label: t('actions.edit', { defaultValue: 'Edit' }),
                icon: <SquarePenIcon />,
                onClick: () => {
                  onEdit()
                },
                type: 'item',
              },
              {
                key: 'del',
                label: t('actions.delete', { defaultValue: 'Delete' }),
                icon: <TrashIcon />,
                onClick: () => {
                  onDelete()
                },
                type: 'item',
                color: 'danger',
              },
            ]}
            align="end"
            side="bottom"
          >
            <button className="outline-none py-2 cursor-pointer" type="button">
              <MoreVerticalIcon className="w-4 h-4" />
            </button>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-0.5 text-xs text-foreground rounded-md border border-border">
          <span>{t('apiKeys.requests', { defaultValue: 'Requests' })}</span>
          <span>{apiKey.totalRequests}</span>
          <span>/</span>
          <span>
            {Number(apiKey.maxRequests) === 0
              ? t('common.unlimited', { defaultValue: 'Unlimited' })
              : apiKey.maxRequests}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 text-xs text-foreground rounded-md border border-border">
          <span>{t('apiKeys.quota', { defaultValue: 'Quota' })}</span>
          <span>{Number(apiKey.totalQuota)}</span>
          <span>/</span>
          <span>
            {Number(apiKey.maxQuota) === 0
              ? t('common.unlimited', { defaultValue: 'Unlimited' })
              : apiKey.maxQuota}
          </span>
        </div>
      </div>
    </div>
  )
}
