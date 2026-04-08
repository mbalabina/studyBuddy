import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/lib/app-context"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Study Buddy",
  description: "Найди идеального напарника для совместного обучения",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}