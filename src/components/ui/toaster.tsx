'use client'

import React from 'react'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

// 单条绿色顶部倒计时条
function CountdownBar({ duration = 4000 }: { duration?: number }) {
  const [progress, setProgress] = React.useState(100)

  React.useEffect(() => {
    let raf: number
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(pct)
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])

  return (
    <div className="absolute left-0 top-0 h-1 w-full overflow-hidden">
      <div
        className="h-full bg-green-500 transition-[width]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()
  const DURATION_MS = 4000

  return (
    <ToastProvider duration={DURATION_MS}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {/* 倒计时条 */}
            <CountdownBar duration={DURATION_MS} />
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
