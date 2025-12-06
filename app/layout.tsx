import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Learning Platform",
  description: "A Learning Platform for Video Courses",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get("theme")?.value
  const initialTheme = themeCookie === "dark" ? "dark" : "light"

  return (
    <html lang="en" className={initialTheme === "dark" ? "dark" : undefined}>
      <body className={`${inter.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased font-sans`}>
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
