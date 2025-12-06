"use client"

import type React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        className:
          "border border-border/60 bg-popover text-popover-foreground shadow-lg data-[type=success]:border-violet-800/70 data-[type=success]:bg-violet-700 data-[type=success]:text-white data-[type=success]:shadow-[0_16px_50px_rgba(109,40,217,0.35)] data-[type=error]:border-destructive/60 data-[type=error]:bg-destructive data-[type=error]:text-destructive-foreground data-[type=error]:shadow-[0_16px_50px_rgba(239,68,68,0.28)]",
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
