import { useCallback, useRef } from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  theme: string
  toggleTheme: () => void
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  theme,
  toggleTheme,
  duration = 450,
  ...props
}: AnimatedThemeTogglerProps) => {
  const isDark = theme === "dark"
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = useCallback(async () => {
    if (!buttonRef.current) return

    // Fallback if view transitions are not supported
    if (!document.startViewTransition) {
      toggleTheme()
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        toggleTheme()
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [toggleTheme, duration])

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className={cn("relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", className)}
      {...props}
    >
      {isDark ? <>Dark</> : <>Light</>}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
