"use client"

import { useApp, type AppScreen } from "@/lib/app-context"
import Image from "next/image"
import { Search, Heart, Home, Plus } from "lucide-react"

export default function HomeScreen() {
  const { state, setScreen } = useApp()
  const user = state.user
  const goals = user.studyGoals

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
            <Image
              src="/mascot.png"
              alt="avatar"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-lg font-semibold">
            {user.firstName || "User"} {user.lastName || ""}
          </span>
        </div>

        {/* Mascot with speech bubble */}
        <div className="relative mb-6">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="text-3xl font-bold leading-tight">
                {"Твои\nобучения"}
              </h1>
              <button
                onClick={() => setScreen("about-goal")}
                className="mt-2 flex items-center gap-1 text-sm text-gray-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="bg-gray-100 rounded-2xl px-3 py-1.5 text-xs font-medium">
                Найти нового бадди!
              </div>
              <Image
                src="/mascot.png"
                alt="mascot"
                width={56}
                height={56}
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Study goals cards */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="w-full bg-[var(--green-light)] rounded-2xl p-4 text-left"
              >
                <h3 className="text-xl font-bold mb-1">{goal.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {"Начали "}{goal.startDate}
                </p>
                {goal.description && (
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                )}
                <button
                  onClick={() => setScreen("search-intro")}
                  className="btn-green text-sm !py-2 !rounded-lg"
                >
                  Найти бадди
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Image
              src="/mascot.png"
              alt="mascot"
              width={80}
              height={80}
              className="w-20 h-20 mb-4 object-contain"
            />
            <p className="text-gray-400 text-center mb-4 text-sm leading-relaxed">
              У тебя пока нет учебных целей.
              <br />
              Поставь цель и найди бадди!
            </p>
            <button onClick={() => setScreen("about-goal")} className="btn-green !w-auto px-8">
              Поставить цель
            </button>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <TabBar active="home" setScreen={setScreen} />
    </div>
  )
}

export function TabBar({
  active,
  setScreen,
}: {
  active: "search" | "likes" | "home"
  setScreen: (s: AppScreen) => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100">
      <div className="flex items-center justify-center gap-2 px-6 py-3 pb-7">
        <button
          onClick={() => setScreen("search-intro")}
          className={`flex items-center justify-center rounded-full transition-all ${
            active === "search"
              ? "gap-1.5 bg-black text-white px-4 py-2"
              : "w-10 h-10"
          }`}
        >
          <Search className="w-5 h-5" />
          {active === "search" && <span className="text-sm font-medium">Поиск</span>}
        </button>
        <button
          onClick={() => setScreen("likes")}
          className={`flex items-center justify-center rounded-full transition-all ${
            active === "likes"
              ? "gap-1.5 bg-black text-white px-4 py-2"
              : "w-10 h-10"
          }`}
        >
          <Heart className={`w-5 h-5 ${active !== "likes" ? "text-gray-400" : ""}`} />
          {active === "likes" && <span className="text-sm font-medium">Мои лайки</span>}
        </button>
        <button
          onClick={() => setScreen("main")}
          className={`flex items-center justify-center rounded-full transition-all ${
            active === "home"
              ? "gap-1.5 bg-black text-white px-4 py-2"
              : "w-10 h-10"
          }`}
        >
          <Home className={`w-5 h-5 ${active !== "home" ? "text-gray-400" : ""}`} />
          {active === "home" && <span className="text-sm font-medium">Главная</span>}
        </button>
      </div>
    </div>
  )
}
