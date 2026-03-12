import { useMemo, useState } from 'react'
import { CircleQuestionMarkIcon, EditIcon, PlusIcon } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useNavigate } from 'react-router'
import { useModelsQuery } from '@/hooks/queries/useModelsQuery'
import { Table } from '@/components/ui/Table'
import { CopyButton } from '@/components/CopyButton'
import { ModelIcon } from '@/components/ModelIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Tooltip } from '../ui/Tooltip'
import { FlexScrollViewer } from '../FlexScrollViewer'
import { useTranslation } from 'react-i18next'

const ALL_OWNED_BY_VALUE = '__all__'

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
  const [ownedByValue, setOwnedByValue] = useState(ALL_OWNED_BY_VALUE)
  const [debouncedSearchValue] = useDebounce(searchValue, 300)
  const modelsQuery = useModelsQuery()
  const canManage = mode === 'admin'
  const navigate = useNavigate()

  const ownedByOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        (modelsQuery.data || []).map((model) => model.ownedBy).filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right))

    return [
      {
        label: t('models.allOwnedBy', { defaultValue: 'All providers' }),
        value: ALL_OWNED_BY_VALUE,
      },
      ...values.map((value) => ({
        label: (
          <div className="flex items-center gap-2">
            <ModelIcon className="w-4 h-4" model={value} />
            <span className="capitalize">{value}</span>
          </div>
        ),
        value,
      })),
    ]
  }, [modelsQuery.data, t])

  const dataSource = useMemo(() => {
    return (modelsQuery.data || []).filter((model) => {
      const keyword = debouncedSearchValue.toLowerCase()
      const matchesKeyword = model.id.toLowerCase().includes(keyword)
      const matchesOwnedBy =
        ownedByValue === ALL_OWNED_BY_VALUE || model.ownedBy === ownedByValue

      return matchesKeyword && matchesOwnedBy
    })
  }, [modelsQuery.data, debouncedSearchValue, ownedByValue])

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0 min-h-0 h-full">
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
        <div className="w-48 shrink-0">
          <Select
            options={ownedByOptions}
            value={ownedByValue}
            onChange={setOwnedByValue}
            placeholder={t('models.ownedBy', { defaultValue: 'Owned By' })}
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
              {
                key: 'providers',
                label: t('models.providers', { defaultValue: 'Providers' }),
                width: 120,
                render(_, record) {
                  const providers = record.providers || []
                  const uniqueProviders = Array.from(
                    new Map(providers.map((p) => [p.icon, p])).values()
                  )
                  return uniqueProviders.length > 0 ? (
                    <div className="flex items-center">
                      {uniqueProviders.map((provider, providerIndex) => (
                        <Tooltip key={providerIndex} content={provider.name}>
                          <span className="inline-flex mr-1">
                            <ModelIcon model={provider.icon} />
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )
                },
              },
            ]}
            data={dataSource}
          />
        )}
      </FlexScrollViewer>
    </div>
  )
}
