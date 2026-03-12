"use client"

import { useApp, mockCandidates, type Candidate } from "@/lib/app-context"
import Image from "next/image"
import { ChevronLeft, Plus, Search, Heart, Home } from "lucide-react"
import { TabBar } from "@/components/screens/home-screen"
import { useState } from "react"

// ==================== SEARCH INTRO ====================
export default function SearchIntroScreen() {
  const { setScreen, setState, state } = useApp()
  const goals = state.user.studyGoals

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6">
          <button onClick={() => setScreen("main")} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Поиск бадди</h1>
          <div className="w-6" />
        </div>

        {/* Goal selector */}
        {goals.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-semibold mb-2">Выбери цель:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium whitespace-nowrap"
                >
                  {goal.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hero card */}
        <div className="relative h-[55vh] overflow-hidden mt-4">
          <Image
            src={mockCandidates[0]?.avatar || "/mascot.png"}
            alt="candidate"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-5 right-5">
            <p className="text-white text-lg font-medium mb-2">
              {"Нашли "}{mockCandidates.length}{" человек для тебя"}
            </p>
            <p className="text-white/80 text-sm">
              Просмотри профили и выбери своего Study Buddy
            </p>
          </div>
        </div>

        <div className="px-5 py-6">
          <button
            onClick={() => {
              setState((prev) => ({ ...prev, currentCandidateIndex: 0 }))
              setScreen("search-card")
            }}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold"
          >
            К выбору
          </button>
        </div>
      </div>

      <TabBar active="search" setScreen={setScreen} />
    </div>
  )
}

// ==================== CANDIDATE CARD (Tinder-like) ====================
export function CandidateCardScreen() {
  const { state, setScreen, likeCurrent, rejectCurrent, setState } = useApp()
  const [showInfo, setShowInfo] = useState(false)

  const candidate = mockCandidates[state.currentCandidateIndex]

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-dvh items-center justify-center px-6">
        <Image src="/mascot.png" alt="mascot" width={100} height={100} className="w-24 h-24 mb-4 object-contain" />
        <h2 className="text-xl font-bold mb-2 text-center">Кандидаты закончились</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Мы подберем новых бадди для тебя</p>
        <button onClick={() => setScreen("main")} className="px-8 py-3 bg-black text-white rounded-xl font-semibold">
          На главную
        </button>
      </div>
    )
  }

  const handleLike = () => {
    setState((prev) => ({
      ...prev,
      matchedCandidate: candidate,
      likedCandidates: [...prev.likedCandidates, candidate.id],
    }))
    likeCurrent()
    // Переходим к следующему кандидату вместо профиля
    setScreen("search-card")
  }

  const handleSkip = () => {
    rejectCurrent()
  }

  const handleViewProfile = () => {
    setState((prev) => ({
      ...prev,
      matchedCandidate: candidate,
    }))
    setScreen("search-profile")
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="relative flex-1">
        {/* Full-screen photo */}
        <div className="relative h-[72vh]">
          <Image
            src={candidate.avatar}
            alt={candidate.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Info overlay */}
          <div className="absolute bottom-6 left-5 right-5">
            <div className="inline-block bg-black text-white text-sm font-bold rounded-full px-3 py-1 mb-2">
              {candidate.compatibility}% совместимость
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {candidate.name}
            </h2>
            <p className="text-white/80 text-sm">
              {candidate.age} лет · {candidate.city}
            </p>
            <p className="text-white/70 text-xs mt-2">
              {candidate.university} · {candidate.course}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setScreen("search-intro")}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 py-5">
          <button
            onClick={handleSkip}
            className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center active:scale-95 transition-transform hover:bg-rose-100"
            title="Пропустить"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={handleLike}
            className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center active:scale-95 transition-transform hover:bg-green-200"
            title="Нравится"
          >
            <Heart className="w-6 h-6 fill-green-600 text-green-600" />
          </button>
          <button
            onClick={handleViewProfile}
            className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center active:scale-95 transition-transform hover:bg-blue-200"
            title="Подробнее"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="19" cy="12" r="1" fill="currentColor" />
              <circle cx="5" cy="12" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <TabBar active="search" setScreen={setScreen} />
    </div>
  )
}

// ==================== CANDIDATE DETAIL / PROFILE ====================
export function CandidateDetailScreen() {
  const { state, setScreen, setState } = useApp()
  const candidate = state.matchedCandidate || mockCandidates[0]
  const isLiked = state.likedCandidates.includes(candidate.id)

  const handleToggleLike = () => {
    setState((prev) => {
      const liked = prev.likedCandidates.includes(candidate.id)
      return {
        ...prev,
        likedCandidates: liked
          ? prev.likedCandidates.filter((id) => id !== candidate.id)
          : [...prev.likedCandidates, candidate.id],
      }
    })
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Photo */}
        <div className="relative h-[50vh]">
          <Image
            src={candidate.avatar}
            alt={candidate.name}
            fill
            className="object-cover"
          />
          <button
            onClick={() => setScreen("search-card")}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Compat badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="bg-black text-white text-sm font-bold rounded-full px-4 py-1.5">
              {candidate.compatibility}% совместимость
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {candidate.name}
              </h2>
              <p className="text-gray-400 text-sm">
                {candidate.age} лет · {candidate.city}
              </p>
            </div>
            <button
              onClick={handleToggleLike}
              className={`p-2 rounded-full transition-all ${
                isLiked
                  ? "bg-red-100"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-semibold mb-1">Цель обучения</p>
              <p className="text-sm text-gray-600 font-medium mb-1">{candidate.goal}</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {candidate.goalDescription}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Образование</p>
              <p className="text-sm text-gray-500">
                {candidate.university}
              </p>
              <p className="text-sm text-gray-500">
                {candidate.course}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Контакт</p>
              <p className="text-sm text-gray-500">
                {candidate.telegram}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-5 pb-8 pt-4 bg-white border-t border-gray-100">
        <button
          onClick={() => {
            handleToggleLike()
            setScreen("search-card")
          }}
          className="w-full py-3 bg-black text-white rounded-xl font-semibold"
        >
          {isLiked ? "Убрать из избранного" : "Добавить в избранное"}
        </button>
      </div>
    </div>
  )
}

// ==================== LIKES SCREEN ====================
export function LikesScreen() {
  const { setScreen, state } = useApp()
  const goals = state.user.studyGoals

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        <h1 className="text-2xl font-bold mb-2">Мои лайки</h1>

        {/* Goals tabs */}
        {goals.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium whitespace-nowrap"
              >
                {goal.name}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={() => setScreen("likes-candidates")}
            className="w-full p-4 bg-green-50 rounded-xl text-left hover:bg-green-100 transition-colors"
          >
            <p className="text-sm font-semibold mb-1">👀 Просмотр кандидатов</p>
            <p className="text-xs text-gray-500">
              Посмотри подобранных для тебя кандидатов и найди своего бадди!
            </p>
          </button>

          <button
            onClick={() => setScreen("likes-admirers")}
            className="w-full p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors"
          >
            <p className="text-sm font-semibold mb-1">💕 Отобрали тебя</p>
            <p className="text-xs text-gray-500">
              Посмотри кто выбрал тебя для совместного обучения!
            </p>
          </button>

          <button
            onClick={() => setScreen("likes-my-favorites")}
            className="w-full p-4 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors"
          >
            <p className="text-sm font-semibold mb-1">❤️ Отобрал ты</p>
            <p className="text-xs text-gray-500">
              Посмотри кого ты уже выбрал для совместного обучения!
            </p>
          </button>
        </div>
      </div>

      <TabBar active="likes" setScreen={setScreen} />
    </div>
  )
}

// ==================== LIKES CANDIDATES LIST ====================
export function LikesCandidatesScreen() {
  const { setScreen, setState, state } = useApp()

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setScreen("likes")} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Подобранные кандидаты</h1>
            <p className="text-sm text-gray-500">{mockCandidates.length} человек</p>
          </div>
        </div>

        {/* Candidates list */}
        <div className="space-y-3">
          {mockCandidates.map((c, index) => {
            const isLiked = state.likedCandidates.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    matchedCandidate: c,
                    currentCandidateIndex: index,
                  }))
                  setScreen("search-profile")
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={c.avatar}
                    alt={c.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.age} лет, {c.city}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-black">{c.compatibility}%</span>
                  {isLiked && (
                    <Heart className="w-5 h-5 fill-red-500 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <TabBar active="likes" setScreen={setScreen} />
    </div>
  )
}

// ==================== ADMIRERS LIST ====================
export function AdmirersScreen() {
  const { setScreen, setState } = useApp()

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setScreen("likes")} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Отобрали тебя</h1>
            <p className="text-sm text-gray-500">{mockCandidates.length} человек</p>
          </div>
        </div>

        {/* Admirers list */}
        <div className="space-y-3">
          {mockCandidates.map((c, index) => (
            <button
              key={c.id}
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  matchedCandidate: c,
                  currentCandidateIndex: index,
                }))
                setScreen("search-profile")
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={c.avatar}
                  alt={c.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-gray-500">
                  {c.age} лет, {c.city}
                </p>
              </div>
              <span className="text-lg font-bold text-black">{c.compatibility}%</span>
            </button>
          ))}
        </div>
      </div>

      <TabBar active="likes" setScreen={setScreen} />
    </div>
  )
}

// ==================== MY FAVORITES LIST ====================
export function MyFavoritesScreen() {
  const { setScreen, setState, state } = useApp()
  const favorites = mockCandidates.filter((c) => state.likedCandidates.includes(c.id))

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setScreen("likes")} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Мое избранное</h1>
            <p className="text-sm text-gray-500">{favorites.length} человек</p>
          </div>
        </div>

        {/* Favorites list */}
        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((c, index) => (
              <button
                key={c.id}
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    matchedCandidate: c,
                    currentCandidateIndex: mockCandidates.indexOf(c),
                  }))
                  setScreen("search-profile")
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={c.avatar}
                    alt={c.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.age} лет, {c.city}
                  </p>
                </div>
                <span className="text-lg font-bold text-black">{c.compatibility}%</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              У тебя пока нет избранных
            </p>
          </div>
        )}
      </div>

      <TabBar active="likes" setScreen={setScreen} />
    </div>
  )
}
