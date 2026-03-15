import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react'
import { useMap, useScroll, useSize } from 'ahooks'
import { cn } from '../utils/cn'
import { Checkbox } from '../Checkbox'
import s from './index.module.scss'

interface TableLocale {
  noData?: React.ReactNode
  emptyListHint?: React.ReactNode
}

export interface TableColumn<T> {
  key: string
  label: string
  render?: (value: any, record: T) => React.ReactNode // T[keyof T] is too strict, use any for flexibility
  width?: string | number
  ellipsis?: boolean
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
}

interface TableProps<T = any> {
  rowKey: (record: T) => string
  columns: TableColumn<T>[]
  data: T[]
  rowRender?: (children: React.ReactNode, record: T) => React.ReactNode

  selectedRowKeys?: string[]
  onSelectedRowKeysChange?: (selectedRowKeys: string[]) => void
  selectable?: boolean
  locale?: TableLocale
}

export function Table<T extends Record<string, any> = {}>({
  rowKey,
  columns,
  data,
  rowRender,
  selectable = false,
  selectedRowKeys,
  onSelectedRowKeysChange,
  locale,
}: TableProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [selectedIndexesMap, selectedIndexesMapAction] = useMap<
    string,
    boolean
  >(selectedRowKeys?.map((d) => [d, true]))
  const scroll = useScroll(scrollContainerRef)
  const scrollContainerSize = useSize(scrollContainerRef)
  const tableSize = useSize(tableRef)

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
  const scrollTop = scroll?.top || 0
  const scrollLeft = scroll?.left || 0
  const maxScrollLeft = useMemo(() => {
    const containerWidth = scrollContainerSize?.width || 0
    const tableWidth = tableRef.current?.scrollWidth || tableSize?.width || 0

    return Math.max(tableWidth - containerWidth, 0)
  }, [scrollContainerSize?.width, tableSize?.width])
  const scrollState = useMemo(
    () => ({
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < maxScrollLeft - 1,
    }),
    [maxScrollLeft, scrollLeft]
  )
  const leftFixedOffsets = useMemo(() => {
    let accumulatedLeft = selectable ? 80 : 0
    const offsets = new Map<string, number>()

    for (const column of columns) {
      if (column.fixed !== 'left') {
        continue
      }

      offsets.set(column.key, accumulatedLeft)
      accumulatedLeft += Number(column.width || 160)
    }

    return offsets
  }, [columns, selectable])
  const rightFixedOffsets = useMemo(() => {
    let accumulatedRight = 0
    const offsets = new Map<string, number>()

    for (let index = columns.length - 1; index >= 0; index -= 1) {
      const column = columns[index]
      if (column.fixed !== 'right') {
        continue
      }

      offsets.set(column.key, accumulatedRight)
      accumulatedRight += Number(column.width || 160)
    }

    return offsets
  }, [columns])
  const selectableColProps: {
    style: CSSProperties
  } = {
    style: { width: 80, minWidth: 80, textAlign: 'center' },
  }

  const getCellStyle = useCallback(
    (col: TableColumn<T>, isHeader = false): CSSProperties => {
      const isFixedLeft = col.fixed === 'left'
      const isFixedRight = col.fixed === 'right'

      return {
        width: col.width,
        minWidth: col.width,
        ...(col.ellipsis && {
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }),
        textAlign: col.align || 'left',
        ...(isFixedLeft && {
          position: 'sticky',
          left: leftFixedOffsets.get(col.key) || 0,
          zIndex: isHeader ? 12 : 2,
          background: 'var(--color-background)',
        }),
        ...(isFixedRight && {
          position: 'sticky',
          right: rightFixedOffsets.get(col.key) || 0,
          zIndex: isHeader ? 12 : 2,
          background: 'var(--color-background)',
        }),
      }
    },
    [leftFixedOffsets, rightFixedOffsets]
  )

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
              style={getCellStyle(col)}
              className={cn({
                [s.FixedLeftCell]: col.fixed === 'left',
                [s.FixedLeftShadow]:
                  col.fixed === 'left' && scrollState.canScrollLeft,
                [s.FixedRightCell]: col.fixed === 'right',
                [s.FixedRightShadow]:
                  col.fixed === 'right' && scrollState.canScrollRight,
              })}
            >
              {col.render
                ? col.render(record[col.key], record)
                : record[col.key]}
            </td>
          ))}
        </tr>
      )
    },
    [rowKey, columns, selectable, selectedIndexesMap, getCellStyle, scrollState]
  )

  return (
    <div
      ref={scrollContainerRef}
      className={cn(s.TableRoot, 'w-full h-full rounded-md overflow-x-auto')}
    >
      <div className="w-full h-full">
        <table ref={tableRef}>
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
                  style={getCellStyle(col, true)}
                  className={cn('bg-background', {
                    [s.FixedLeftCell]: col.fixed === 'left',
                    [s.FixedLeftShadow]:
                      col.fixed === 'left' && scrollState.canScrollLeft,
                    [s.FixedRightCell]: col.fixed === 'right',
                    [s.FixedRightShadow]:
                      col.fixed === 'right' && scrollState.canScrollRight,
                  })}
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
              {locale?.noData ?? 'No data'}
            </div>
            <span className="text-xs opacity-50">
              {locale?.emptyListHint ?? 'No records yet'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
