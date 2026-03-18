"use client"

import type { AppScreen } from "@/lib/app-context"
import { useApp } from "@/lib/app-context"
import { Search, Heart, Home } from "lucide-react"

export function TabBar({
  setScreen,
}: {
  active?: "search" | "likes" | "home"
  setScreen: (s: AppScreen) => void
}) {
  const { state } = useApp()
  const screen = state.screen

  const isHome = screen === "main"
  const isLikes = screen === "likes" || screen === "likes-candidates"
  const isSearch = screen === "search-intro" || screen === "search-card" || screen === "search-profile"

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100">
      <div className="flex items-center justify-center gap-2 px-6 py-3 pb-7">
        <button
          onClick={() => setScreen("search-intro")}
          className={`flex items-center justify-center rounded-full transition-all ${
            isSearch ? "gap-1.5 bg-black text-white px-4 py-2" : "w-10 h-10"
          }`}
        >
          <Search className="w-5 h-5" />
          {isSearch && <span className="text-sm font-medium">Поиск</span>}
        </button>
        <button
          onClick={() => setScreen("likes")}
          className={`flex items-center justify-center rounded-full transition-all ${
            isLikes ? "gap-1.5 bg-black text-white px-4 py-2" : "w-10 h-10"
          }`}
        >
          <Heart className={`w-5 h-5 ${!isLikes ? "text-gray-400" : ""}`} />
          {isLikes && <span className="text-sm font-medium">Мои лайки</span>}
        </button>
        <button
          onClick={() => setScreen("main")}
          className={`flex items-center justify-center rounded-full transition-all ${
            isHome ? "gap-1.5 bg-black text-white px-4 py-2" : "w-10 h-10"
          }`}
        >
          <Home className={`w-5 h-5 ${!isHome ? "text-gray-400" : ""}`} />
          {isHome && <span className="text-sm font-medium">Главная</span>}
        </button>
      </div>
    </div>
  )
}
