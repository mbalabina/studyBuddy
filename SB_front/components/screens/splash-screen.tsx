"use client"

import { useApp } from "@/lib/app-context"
import { useEffect } from "react"
import Image from "next/image"

export default function SplashScreen() {
  const { setScreen } = useApp()

  useEffect(() => {
    const timer = setTimeout(() => setScreen("auth"), 2000)
    return () => clearTimeout(timer)
  }, [setScreen])

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-8 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-36 h-36 relative mb-4">
          <Image src="/mascot.png" alt="Study Buddy" fill className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Study Buddy</h1>
      </div>
    </div>
  )
}
