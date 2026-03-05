import { useMemo, useState } from 'react'
import { CircleQuestionMarkIcon, EditIcon, PlusIcon } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useNavigate } from 'react-router'
import { useModelsQuery } from '@/hooks/queries/useModelsQuery'
import { cn } from '@/utils/cn'
import { Table } from '@/components/ui/Table'
import { CopyButton } from '@/components/CopyButton'
import { ModelIcon } from '@/components/ModelIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '../ui/Input'
import { Tooltip } from '../ui/Tooltip'
import { FlexScrollViewer } from '../FlexScrollViewer'
import { useTranslation } from 'react-i18next'

interface ModelTableProps {
  selectable?: boolean
  selectedIds?: string[]
  onSelectedIdsChange?: (selectedIds: string[]) => void
  mode?: 'tenant' | 'admin'
}

export const ModelTable: React.FC<ModelTableProps> = ({
  selectable = false,
  selectedIds,
  onSelectedIdsChange,
  mode = 'tenant',
}) => {
  const { t } = useTranslation('common')
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebounce(searchValue, 300)
  const modelsQuery = useModelsQuery()
  const canManage = mode === 'admin'
  const navigate = useNavigate()

  const dataSource = modelsQuery.data || []

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 h-full">
      <div className="flex gap-4 shrink-0">
        <div className="w-full">
          <Input
            className="w-full"
            placeholder={t('models.searchPlaceholder', {
              defaultValue: 'Search models...',
            })}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
            }}
          />
        </div>
        {canManage && (
          <div className="flex items-center ml-auto gap-2">
            <Button
              onClick={() => {
                navigate('/models/new')
              }}
            >
              <PlusIcon />
              {t('models.addModel', { defaultValue: 'Add Model' })}
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="ml-auto">
          <Tooltip
            content={t('models.rateHint', {
              defaultValue: 'USD/CNY conversion rate is 1:8',
            })}
          >
            <CircleQuestionMarkIcon className="w-4 h-4" />
          </Tooltip>
        </div>
      </div>
      <FlexScrollViewer bordered>
        {dataSource.length > 0 && (
          <Table
            rowKey={(d) => d.id}
            selectable={selectable}
            selectedRowKeys={selectedIds}
            onSelectedRowKeysChange={onSelectedIdsChange}
            columns={[
              {
                key: 'id',
                label: 'ID',
                width: 240,
                render: (value, record) => {
                  return (
                    <div className="flex items-center gap-2">
                      <ModelIcon className="w-4 h-4" model={record.ownedBy} />
                      <div className="flex-1 min-w-0 truncate">{value}</div>
                      <div className="flex items-center gap-2 ml-auto">
                        <CopyButton text={value} />
                        {canManage && (
                          <EditIcon
                            className="w-4 h-4 cursor-pointer"
                            onClick={() => {
                              navigate(`/models/${record.id}`)
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'inputPricing',
                label: t('models.input', { defaultValue: 'Input' }),
                width: 160,
                render(_, record) {
                  const value = record.pricing.input
                  return Number(value) ? `¥${value}` : '-'
                },
                align: 'right',
              },
              ...(mode === 'admin'
                ? [
                    {
                      key: 'isPublic',
                      label: t('models.visibility', {
                        defaultValue: 'Visibility',
                      }),
                      width: 120,
                      render: (value: boolean) =>
                        value
                          ? t('models.public', { defaultValue: 'Public' })
                          : t('models.private', { defaultValue: 'Private' }),
                    },
                  ]
                : []),
              {
                key: 'outputPricing',
                label: t('models.output', { defaultValue: 'Output' }),
                width: 160,
                render(_, record) {
                  const value = record.pricing.output
                  return Number(value) ? `¥${value}` : '-'
                },
                align: 'right',
              },
            ]}
            data={dataSource}
          />
        )}
      </FlexScrollViewer>
    </div>
  )
}
