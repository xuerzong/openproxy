'use client'

import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from 'lucide-react'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useSyncState } from '../hooks/useSyncState'
import { mergeProps } from '../utils/props'
import useUpdateEffect from '../hooks/useUpdateEffect'
import { Button, type ButtonProps } from '../Button'
import s from './index.module.scss'

const defaultLocale = {
  next: 'Next',
  prev: 'Previous',
}

export interface PaginationProps {
  total?: number
  current?: number
  pageSize?: number
  onValueChange?: (value: { current: number; pageSize: number }) => void

  className?: string
  style?: CSSProperties
  locale?: Record<string, string>
}

export const Pagination: React.FC<PaginationProps> = ({
  current: defaultCurrent = 1,
  total = 0,
  pageSize = 20,
  onValueChange,
  locale = defaultLocale,
  ...restProps
}) => {
  const [current, setCurrent] = useSyncState(defaultCurrent)
  const buttonProps: ButtonProps = {
    size: 'default',
    type: 'button',
    variant: 'outline',
    className: s.PaginationButton,
  }
  const pagesNum = useMemo(() => {
    return Math.max(Math.ceil(total / pageSize), 1)
  }, [total, pageSize])
  const [currentPages, setCurrentPages] = useState<number[]>([])

  const generateNextPages = (nextPage: number) => {
    setCurrentPages((prePages) => {
      const pages = new Array(pagesNum).fill(0).map((_, idx) => idx + 1)

      if (pagesNum <= 6) return pages

      let tempPages = prePages

      const hasPreEllipsis = prePages[1] === 0
      const hasNextEllipsis = prePages[prePages.length - 2] === 0

      if (hasPreEllipsis) {
        tempPages = tempPages.slice(2)
      }

      if (hasNextEllipsis) {
        tempPages = tempPages.slice(0, -2)
      }

      if (
        nextPage === 1 ||
        nextPage === pagesNum ||
        nextPage === tempPages[0] ||
        nextPage === tempPages[tempPages.length - 1] ||
        prePages.length === 0
      ) {
        const finalPages: number[] = [1]

        const sliceStartIndex = Math.max(nextPage - 3, 1)

        let midPages = pages.slice(sliceStartIndex, sliceStartIndex + 5)

        if (midPages.length < 5) {
          midPages.unshift(
            ...pages.slice(
              sliceStartIndex - (5 - midPages.length),
              sliceStartIndex
            )
          )
        }

        if (midPages[0] > 2) {
          finalPages.push(0)
        } else {
          // If midPages is [2, 3, 4, 5, 6], the finalPages is [1, 2, 3, 4, 5, 6].
          // But it should be [1, 2, 3, 4, 5] actually.
          midPages = midPages.slice(0, 4)
        }

        finalPages.push(...midPages)

        if (midPages[midPages.length - 1] !== pages[pages.length - 1]) {
          finalPages.push(...[0, pages[pages.length - 1]])
        }

        return finalPages
      } else {
        return prePages
      }
    })
  }

  useEffect(() => {
    generateNextPages(current)
  }, [total, current])

  useUpdateEffect(() => {
    onValueChange?.({ current, pageSize })
  }, [current, pageSize])

  const mergedProps = useMemo(() => {
    return mergeProps({ className: s.Pagination }, restProps)
  }, [restProps])

  if (currentPages.length < 2) {
    return null
  }

  return (
    <div {...mergedProps}>
      <Button
        {...buttonProps}
        onClick={() => {
          setCurrent((pre) => Math.max(pre - 1, 1))
        }}
        disabled={current === 1}
      >
        <ChevronLeftIcon className="w-4 h-4" />
        {locale.prev}
      </Button>
      {currentPages.map((page, pageIndex) => (
        <Button
          key={pageIndex}
          {...buttonProps}
          size="icon"
          variant={page === current ? 'default' : 'outline'}
          onClick={() => {
            if (page) {
              setCurrent(Number(page))
            }
          }}
        >
          {page === 0 ? <EllipsisIcon /> : page}
        </Button>
      ))}
      <Button
        {...buttonProps}
        disabled={current === pagesNum}
        onClick={() => {
          setCurrent((pre) => Math.min(pre + 1, pagesNum))
        }}
      >
        {locale.next}
        <ChevronRightIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}
