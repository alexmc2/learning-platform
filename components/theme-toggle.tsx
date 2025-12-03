"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
      className="relative"
    >
      <Sun className={cn("size-5 transition-all", theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100")} />
      <Moon className={cn("absolute size-5 transition-all", theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0")} />
    </Button>
  )
}
