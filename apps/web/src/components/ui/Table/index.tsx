import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import { useMap } from 'ahooks'
import { cn } from '@/utils/cn'
import { Checkbox } from '../Checkbox'
import s from './index.module.scss'
import { useTranslation } from 'react-i18next'

export interface TableColumn<T> {
  key: string
  label: string
  render?: (value: any, record: T) => React.ReactNode // T[keyof T] is too strict, use any for flexibility
  width?: string | number
  ellipsis?: boolean
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T = any> {
  rowKey: (record: T) => string
  columns: TableColumn<T>[]
  data: T[]
  rowRender?: (children: React.ReactNode, record: T) => React.ReactNode

  selectedRowKeys?: string[]
  onSelectedRowKeysChange?: (selectedRowKeys: string[]) => void
  selectable?: boolean
}

export function Table<T extends Record<string, any> = {}>({
  rowKey,
  columns,
  data,
  rowRender,
  selectable = false,
  selectedRowKeys,
  onSelectedRowKeysChange,
}: TableProps<T>) {
  const { t } = useTranslation('common')
  const [selectedIndexesMap, selectedIndexesMapAction] = useMap<
    string,
    boolean
  >(selectedRowKeys?.map((d) => [d, true]))

  useEffect(() => {
    onSelectedRowKeysChange?.(Array.from(selectedIndexesMap.keys()))
  }, [selectedIndexesMap])

  const mainCheckedState = useMemo(() => {
    if (!data || data.length === 0) return false

    let hasChecked = false
    let hasUnchecked = false

    for (const row of data) {
      const isSelected = selectedIndexesMap.has(rowKey(row))

      if (isSelected) {
        hasChecked = true
      } else {
        hasUnchecked = true
      }

      if (hasChecked && hasUnchecked) {
        return 'indeterminate'
      }
    }

    return hasChecked ? true : false
  }, [selectedIndexesMap, data, rowKey])
  const [scrollTop, setScrollTop] = useState(0)
  const selectableColProps: {
    style: CSSProperties
  } = {
    style: { width: 80, minWidth: 80, textAlign: 'center' },
  }

  const defaultRowRender = useCallback(
    (record: T) => {
      return (
        <tr key={rowKey(record)}>
          {selectable && (
            <td {...selectableColProps}>
              <Checkbox
                checked={Boolean(selectedIndexesMap.get(rowKey(record)))}
                onCheckedChange={(value) => {
                  if (value) {
                    selectedIndexesMapAction.set(rowKey(record), true)
                  } else {
                    selectedIndexesMapAction.remove(rowKey(record))
                  }
                }}
              />
            </td>
          )}
          {columns.map((col) => (
            <td
              key={col.key}
              style={{
                width: col.width,
                minWidth: col.width,
                ...(col.ellipsis && {
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }),
                textAlign: col.align || 'left',
              }}
            >
              {col.render
                ? col.render(record[col.key], record)
                : record[col.key]}
            </td>
          ))}
        </tr>
      )
    },
    [rowKey, columns, selectable, selectedIndexesMap]
  )

  return (
    <div
      onScroll={(e) => {
        setScrollTop((e.target as HTMLTableElement).scrollTop || 0)
      }}
      className={cn(s.TableRoot, 'w-full h-full rounded-md overflow-x-auto')}
    >
      <div className="w-full h-full">
        <table>
          <thead
            className={cn(
              'sticky top-0 z-10',
              scrollTop > 2 ? 'shadow-xs' : ''
            )}
          >
            <tr>
              {selectable && (
                <th {...selectableColProps} className="bg-background">
                  <Checkbox
                    checked={mainCheckedState}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        data.forEach((d) => {
                          selectedIndexesMapAction.set(rowKey(d), true)
                        })
                      } else {
                        data.forEach((d) => {
                          selectedIndexesMapAction.remove(rowKey(d))
                        })
                      }
                    }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  style={{
                    minWidth: col.width,
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                  className="bg-background"
                  key={col.key}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((record) =>
              rowRender ? (
                <Fragment key={rowKey(record)}>
                  {rowRender(defaultRowRender(record), record)}
                </Fragment>
              ) : (
                <Fragment key={rowKey(record)}>
                  {defaultRowRender(record)}
                </Fragment>
              )
            )}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="w-full flex flex-col gap-6 items-center justify-center h-80">
            <div className="text-md font-bold">
              {t('common.noData', { defaultValue: 'No data' })}
            </div>
            <span className="text-xs opacity-50">
              {t('common.emptyListHint', { defaultValue: 'No records yet' })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
