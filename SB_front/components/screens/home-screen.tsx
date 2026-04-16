"use client"

import { useApp } from "@/lib/app-context"
import Image from "next/image"
import Link from "next/link"
import { Plus, LogOut } from "lucide-react"
import { TabBar } from "@/components/screens/tab-bar"

export default function HomeScreen() {
  const { state, setScreen, setActiveGoal, logout } = useApp()
  const user = state.user
  const goals = user.studyGoals

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Image src="/mascot.png" alt="avatar" width={40} height={40} className="w-full h-full object-cover" />
              )}
            </div>
          </Link>
          <span className="text-lg font-semibold flex-1">
            {user.firstName || state.authEmail?.split("@")[0] || "User"}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Заголовок */}
        <div className="relative mb-6">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="text-3xl font-bold leading-tight">
                Твои обучения
              </h1>
              <button
                onClick={() => setScreen("new-goal")}
                className="mt-2 flex items-center gap-1 text-sm text-gray-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setScreen("search-intro")}
                className="bg-gray-100 rounded-2xl px-3 py-1.5 text-xs font-medium"
              >
                Найти нового бадди!
              </button>
              <Image src="/mascot.png" alt="mascot" width={56} height={56} className="w-14 h-14 object-contain" />
            </div>
          </div>
        </div>

        {/* Цели */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal, goalIndex) => (
              <div key={goal.id} className="w-full bg-[var(--green-light)] rounded-2xl p-4">
                <h3 className="text-xl font-bold mb-1">{goal.name}</h3>
                {goal.description && (
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                )}
                <button
                  onClick={() => {
                    const goalId = goals[goalIndex]?.id
                    if (goalId) {
                      setActiveGoal(goalId).catch(console.error)
                    }
                    setScreen("search-intro")
                  }}
                  className="btn-green text-sm !py-2 !rounded-lg"
                >
                  Найти бадди
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Image src="/mascot.png" alt="mascot" width={80} height={80} className="w-20 h-20 mb-4 object-contain" />
            <p className="text-gray-400 text-center mb-4 text-sm leading-relaxed">
              У тебя пока нет учебных целей.<br />
              Поставь цель и найди бадди!
            </p>
            <button onClick={() => setScreen("new-goal")} className="btn-green !w-auto px-8">
              Поставить цель
            </button>
          </div>
        )}
      </div>

      <TabBar active="home" setScreen={setScreen} />
    </div>
  )
}
