import { useState, useEffect, useCallback, useRef } from 'react'

interface CountdownOptions {
  key: string // 存储在 localStorage 的唯一键名
  seconds?: number // 自定义秒数，默认 60
}

export const useCountdown = ({ key, seconds = 60 }: CountdownOptions) => {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 计算剩余时间
  const calculateRemaining = useCallback(() => {
    const deadline = localStorage.getItem(key)
    if (!deadline) return 0

    const remaining = Math.ceil((Number(deadline) - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  }, [key])

  // 开始倒计时
  const start = useCallback(
    (customSeconds?: number) => {
      const duration = (customSeconds || seconds) * 1000
      const deadline = Date.now() + duration

      localStorage.setItem(key, deadline.toString())
      setTimeLeft(Math.ceil(duration / 1000))
    },
    [key, seconds]
  )

  useEffect(() => {
    // 初始化检查
    const initialRemaining = calculateRemaining()
    if (initialRemaining > 0) {
      setTimeLeft(initialRemaining)
    }

    // 定时器逻辑
    timerRef.current = setInterval(() => {
      const remaining = calculateRemaining()
      setTimeLeft(remaining)

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        localStorage.removeItem(key) // 清理
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [calculateRemaining, key])

  return {
    timeLeft,
    start,
    isCounting: timeLeft > 0,
  }
}
