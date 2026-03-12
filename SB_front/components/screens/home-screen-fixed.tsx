"use client"

import { useApp, type AppScreen } from "@/lib/app-context"
import Image from "next/image"
import { Search, Heart, Home, Plus, ChevronLeft, LogOut } from "lucide-react"
import { useState } from "react"

export default function HomeScreen() {
  const { state, setScreen } = useApp()
  const user = state.user
  const goals = user.studyGoals

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header with profile button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              <Image
                src="/mascot.png"
                alt="avatar"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Привет,</p>
              <span className="text-lg font-semibold">
                {user.firstName || "User"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setScreen("profile")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Профиль"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mascot with speech bubble */}
        <div className="relative mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold leading-tight mb-1">
                Твои цели
              </h1>
              <p className="text-sm text-gray-500">
                {goals.length} {goals.length === 1 ? "цель" : "целей"}
              </p>
            </div>
            <button
              onClick={() => setScreen("about-goal")}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
              title="Добавить цель"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Study goals cards */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="w-full bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-left border border-green-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold">{goal.name}</h3>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    title="Удалить"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  📅 Начали {goal.startDate}
                </p>
                {goal.description && (
                  <p className="text-sm text-gray-700 mb-4">{goal.description}</p>
                )}
                <button
                  onClick={() => setScreen("search-intro")}
                  className="w-full py-2 bg-black text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Найти бадди
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl">
            <Image
              src="/mascot.png"
              alt="mascot"
              width={80}
              height={80}
              className="w-20 h-20 mb-4 object-contain"
            />
            <p className="text-gray-600 text-center mb-2 font-medium">
              У тебя пока нет целей
            </p>
            <p className="text-gray-400 text-center mb-6 text-sm">
              Поставь первую цель и найди Study Buddy!
            </p>
            <button
              onClick={() => setScreen("about-goal")}
              className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
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
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-200">
      <div className="flex items-center justify-around px-4 py-3 pb-6">
        <button
          onClick={() => setScreen("search-intro")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all ${
            active === "search"
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Поиск"
        >
          <Search className="w-5 h-5" />
          <span className="text-xs font-medium">Поиск</span>
        </button>
        <button
          onClick={() => setScreen("likes")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all ${
            active === "likes"
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Мои лайки"
        >
          <Heart className={`w-5 h-5 ${active === "likes" ? "" : ""}`} />
          <span className="text-xs font-medium">Лайки</span>
        </button>
        <button
          onClick={() => setScreen("main")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all ${
            active === "home"
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Главная"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Главная</span>
        </button>
      </div>
    </div>
  )
}

// ==================== PROFILE SCREEN ====================
export function ProfileScreen() {
  const { state, setScreen, updateUser } = useApp()
  const user = state.user
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setScreen("main")} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Мой профиль</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-semibold text-black hover:text-gray-600"
          >
            {isEditing ? "Готово" : "Редактировать"}
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
            <Image
              src="/mascot.png"
              alt="avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div>
            <h2 className="text-lg font-bold mb-4">Личная информация</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Имя</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={user.firstName}
                    onChange={(e) => updateUser({ firstName: e.target.value })}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{user.firstName || "-"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Фамилия</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={user.lastName}
                    onChange={(e) => updateUser({ lastName: e.target.value })}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{user.lastName || "-"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Город</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={user.city}
                    onChange={(e) => updateUser({ city: e.target.value })}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{user.city || "-"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Статус</label>
                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateUser({ role: "student" })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        user.role === "student"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Студент
                    </button>
                    <button
                      onClick={() => updateUser({ role: "pupil" })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        user.role === "pupil"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Ученик
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-700">
                    {user.role === "student" ? "Студент" : "Ученик"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Education Info */}
          <div>
            <h2 className="text-lg font-bold mb-4">Образование</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">ВУЗ</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={user.university}
                    onChange={(e) => updateUser({ university: e.target.value })}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{user.university || "-"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Программа</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={user.program}
                    onChange={(e) => updateUser({ program: e.target.value })}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{user.program || "-"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Курс</label>
                {isEditing ? (
                  <select
                    value={user.course}
                    onChange={(e) => updateUser({ course: e.target.value })}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  >
                    {["1 курс", "2 курс", "3 курс", "4 курс", "5 курс", "6 курс"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700">{user.course || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h2 className="text-lg font-bold mb-4">Контакты</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Мессенджер</label>
                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateUser({ messenger: "telegram" })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        user.messenger === "telegram"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Telegram
                    </button>
                    <button
                      onClick={() => updateUser({ messenger: "vk" })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        user.messenger === "vk"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      VK
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-700">
                    {user.messenger === "telegram" ? "Telegram" : "VK"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  {user.messenger === "telegram" ? "Telegram" : "VK"}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={user.messengerHandle}
                    onChange={(e) => updateUser({ messengerHandle: e.target.value })}
                    placeholder={user.messenger === "telegram" ? "@username" : "vk.com/username"}
                    className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-black outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{user.messengerHandle || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => setScreen("auth")}
            className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
