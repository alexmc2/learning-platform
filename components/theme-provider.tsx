"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const THEME_COOKIE_NAME = "theme"
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  initialTheme = "light",
  children,
}: {
  initialTheme?: Theme
  children: ReactNode
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  const applyTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    if (typeof document !== "undefined") {
      const root = document.documentElement
      root.classList.toggle("dark", nextTheme === "dark")
      document.cookie = `${THEME_COOKIE_NAME}=${nextTheme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}`
    }
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme: applyTheme,
      toggleTheme: () => applyTheme(theme === "dark" ? "light" : "dark"),
    }),
    [applyTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
