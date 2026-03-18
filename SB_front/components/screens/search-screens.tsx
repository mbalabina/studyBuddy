"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp, type Candidate } from "@/lib/app-context"
import { ChevronLeft, Heart, X, MessageCircle, MapPin, GraduationCap } from "lucide-react"
import { TabBar } from "@/components/screens/tab-bar"


export default function SearchIntroScreen() {
  const { state, setScreen, loadCandidates, addStudyGoal } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalDesc, setNewGoalDesc] = useState("")

  useEffect(() => {
    if (state.isLoggedIn) {
      loadCandidates().catch(console.error)
    }
  }, [state.isLoggedIn, loadCandidates])

  const handleAddGoal = () => {
    if (!newGoalName.trim()) return
    addStudyGoal({
      id: Date.now().toString(),
      name: newGoalName.trim(),
      description: newGoalDesc.trim(),
      startDate: new Date().toISOString(),
    })
    setNewGoalName("")
    setNewGoalDesc("")
    setShowModal(false)
  }

  const goals = state.user.studyGoals

  return (
    <div className="flex flex-col min-h-dvh animate-fade-in">
      <div className="flex items-center justify-between px-6 h-14 mt-2">
        <button onClick={() => setScreen("main")} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Поиск Study Buddy</span>
        <div className="w-8" />
      </div>

      <div className="flex items-center gap-2 px-6 mt-1 mb-5 overflow-x-auto">
        {goals.map((goal) => (
          <button
            key={goal.id}
            className="px-4 py-1.5 rounded-full border border-black text-sm font-medium whitespace-nowrap"
          >
            {goal.name}
          </button>
        ))}

        <button
        onClick={() => setScreen("about-goal")}
        className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-400 whitespace-nowrap"
        >
          +
        </button>
      </div>

      <div className="flex-1 px-6 space-y-4">
        {state.apiError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.apiError}
          </div>
        )}

        <button
          className="w-full bg-[var(--green-light)] rounded-3xl p-5 text-left"
          onClick={() => setScreen("search-card")}
          disabled={state.isLoadingCandidates}
        >
          <p className="text-lg font-bold mb-1">
            {state.isLoadingCandidates ? "Загружаем..." : "Просмотр кандидатов"}
          </p>
          <p className="text-sm text-gray-600">
            Посмотри подобранных для тебя кандидатов и найди своего бадди!
          </p>
        </button>

        <button
          className="w-full bg-[var(--green-light)] rounded-3xl p-5 text-left"
          onClick={() => setScreen("likes")}
        >
          <p className="text-lg font-bold mb-1">Отобрали тебя</p>
          <p className="text-sm text-gray-600">
            Посмотри кто выбрал тебя для совместного обучения!
          </p>
        </button>

        <button
          className="w-full bg-[var(--green-light)] rounded-3xl p-5 text-left"
          onClick={() => setScreen("likes")}
        >
          <p className="text-lg font-bold mb-1">Отобрал ты</p>
          <p className="text-sm text-gray-600">
            Посмотри кого ты уже выбрал для совместного обучения!
          </p>
        </button>
      </div>

      <TabBar active="likes" setScreen={setScreen} />

      {/* Модальное окно добавления цели */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Новая учебная цель</h2>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Название</label>
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="Например: IELTS, ЕГЭ математика..."
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Описание (необязательно)</label>
              <input
                type="text"
                value={newGoalDesc}
                onChange={(e) => setNewGoalDesc(e.target.value)}
                placeholder="Что именно хочешь достичь?"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              className="btn-green"
              onClick={handleAddGoal}
              disabled={!newGoalName.trim()}
            >
              Добавить
            </button>
            <button className="btn-outline-gray" onClick={() => setShowModal(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


export function CandidateCardScreen() {
  const { state, setScreen, likeCurrent, rejectCurrent } = useApp()

  const candidate = state.candidates[state.currentCandidateIndex]

  if (state.isLoadingCandidates) {
    return (
      <div className="flex flex-col min-h-dvh px-6">
        <div className="flex items-center justify-between h-14 mt-2">
          <button onClick={() => setScreen("search-intro")} className="p-1" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold">Кандидаты</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Загружаем кандидатов...
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
        <div className="flex items-center justify-between h-14 mt-2">
          <button onClick={() => setScreen("search-intro")} className="p-1" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold">Кандидаты</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="bg-[var(--green-light)] rounded-3xl p-6 w-full">
            <h2 className="text-xl font-bold mb-2">Кандидаты закончились</h2>
            <p className="text-sm text-gray-600 mb-6">
              Попробуй зайти позже или обновить подборку.
            </p>
            <button className="btn-green" onClick={() => setScreen("search-intro")}>
              Назад
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen("search-intro")} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Кандидаты</span>
        <div className="text-sm text-gray-400">
          {state.currentCandidateIndex + 1}/{state.candidates.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <CandidateCardView candidate={candidate} onOpen={() => setScreen("search-profile")} />

        <div className="flex items-center justify-center gap-6 mt-6 pb-8">
          <button
            onClick={rejectCurrent}
            className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white shadow-sm"
            aria-label="Skip"
          >
            <X className="w-7 h-7" />
          </button>
          <button
            onClick={likeCurrent}
            className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center shadow-lg"
            aria-label="Like"
          >
            <Heart className="w-7 h-7 fill-current" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function CandidateDetailScreen() {
  const { state, setScreen, likeCurrent } = useApp()

  const candidate = state.candidates[state.currentCandidateIndex]

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-dvh px-6">
        <div className="flex items-center justify-between h-14 mt-2">
          <button onClick={() => setScreen("search-card")} className="p-1" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold">Профиль</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Кандидат не найден
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh animate-fade-in">
      <div className="px-6">
        <div className="flex items-center justify-between h-14 mt-2">
          <button onClick={() => setScreen("search-card")} className="p-1" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold">Профиль</span>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-6 pb-8">
        <img
          src={candidate.avatar}
          alt={candidate.name}
          className="w-full h-[320px] object-cover rounded-3xl"
        />

        <div className="mt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              <p className="text-sm text-gray-500">{candidate.age} лет</p>
            </div>
            <div className="rounded-full bg-[var(--green-light)] px-3 py-1 text-sm font-semibold">
              {candidate.compatibility}% match
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{candidate.city || "Город не указан"}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>{candidate.university || "Учебное заведение не указано"}</span>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Цель</p>
              <p className="font-medium">{candidate.goal || "Цель не указана"}</p>
              <p className="text-sm text-gray-600 mt-2">
                {candidate.goalDescription || "Описание пока не заполнено"}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Контакт</p>
              <p>{candidate.telegram || "Telegram не указан"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            className="btn-green"
            onClick={() => {
              likeCurrent()
              setScreen("match-success")
            }}
          >
            Лайкнуть
          </button>
          <button className="btn-outline-gray" onClick={() => setScreen("search-card")}>
            Назад к карточкам
          </button>
        </div>
      </div>
    </div>
  )
}

export function MatchWaitingScreen() {
  const { setScreen } = useApp()

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--green-light)] flex items-center justify-center mb-6">
          <Heart className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Лайк отправлен</h1>
        <p className="text-sm text-gray-600 mb-8 max-w-[280px]">
          Если симпатия взаимная, вы сможете перейти к общению.
        </p>
        <button className="btn-green" onClick={() => setScreen("search-card")}>
          Смотреть дальше
        </button>
      </div>
    </div>
  )
}

export function MatchSuccessScreen() {
  const { state, setScreen } = useApp()

  const candidate =
    state.matchedCandidate ??
    state.candidates[Math.max(0, state.currentCandidateIndex - 1)] ??
    null

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--green-light)] flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Контакт сохранён</h1>
        <p className="text-sm text-gray-600 mb-3">
          {candidate ? `Ты лайкнула ${candidate.name}.` : "Лайк успешно отправлен."}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          {candidate?.telegram ? `Связь: ${candidate.telegram}` : "Контакт пока не указан."}
        </p>
        <div className="w-full space-y-3">
          <button className="btn-green" onClick={() => setScreen("search-card")}>
            Продолжить поиск
          </button>
          <button className="btn-outline-gray" onClick={() => setScreen("likes")}>
            Перейти в мои лайки
          </button>
        </div>
      </div>
    </div>
  )
}

export function LikesScreen() {
  const { state, setScreen } = useApp()

  const likedItems = useMemo(
    () => state.candidates.filter((candidate) => state.likedCandidates.includes(candidate.id)),
    [state.candidates, state.likedCandidates]
  )

  return (
    <div className="flex flex-col min-h-dvh animate-fade-in">
      <div className="flex items-center justify-between px-6 h-14 mt-2">
        <button onClick={() => setScreen("main")} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Мои лайки</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 px-6 pt-4 pb-28">
        {likedItems.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-6 text-center mt-10">
            <h2 className="text-lg font-semibold mb-2">Пока пусто</h2>
            <p className="text-sm text-gray-500 mb-5">Ты ещё никого не лайкнула.</p>
            <button className="btn-green" onClick={() => setScreen("search-intro")}>
              Перейти к поиску
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {likedItems.map((candidate) => (
              <MiniCandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => {
                  const index = state.candidates.findIndex((item) => item.id === candidate.id)
                  setScreen("likes-candidates")
                  if (index >= 0) {
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent("studybuddy-open-liked-candidate", {
                          detail: { index },
                        })
                      )
                    }, 0)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <TabBar active="search" setScreen={setScreen} />
    </div>
  )
}


export function LikesCandidatesScreen() {
  const { state, setScreen, setState } = useApp()

  const likedItems = useMemo(
    () => state.candidates.filter((candidate) => state.likedCandidates.includes(candidate.id)),
    [state.candidates, state.likedCandidates]
  )

  const currentLikedCandidate = likedItems[0] ?? null

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ index: number }>
      const index = custom.detail?.index
      if (typeof index === "number") {
        setState((prev) => ({ ...prev, currentCandidateIndex: index }))
      }
    }
    window.addEventListener("studybuddy-open-liked-candidate", handler)
    return () => window.removeEventListener("studybuddy-open-liked-candidate", handler)
  }, [setState])

  const candidate =
    state.candidates[state.currentCandidateIndex] ?? currentLikedCandidate

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-dvh px-6">
        <div className="flex items-center justify-between h-14 mt-2">
          <button onClick={() => setScreen("likes")} className="p-1" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold">Избранное</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Нет выбранного профиля
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen("likes")} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Избранное</span>
        <div className="w-8" />
      </div>
      <div className="pt-4">
        <CandidateCardView candidate={candidate} onOpen={() => setScreen("search-profile")} />
      </div>
    </div>
  )
}

function CandidateCardView({
  candidate,
  onOpen,
}: {
  candidate: Candidate
  onOpen: () => void
}) {
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      <img
        src={candidate.avatar}
        alt={candidate.name}
        className="w-full h-[420px] object-cover"
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{candidate.name}</h2>
            <p className="text-sm text-gray-500">
              {candidate.age} лет, {candidate.city || "город не указан"}
            </p>
          </div>
          <div className="rounded-full bg-[var(--green-light)] px-3 py-1 text-sm font-semibold">
            {candidate.compatibility}%
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Учёба:</span> {candidate.university || "не указано"}
          </p>
          <p>
            <span className="font-medium">Цель:</span> {candidate.goal || "не указано"}
          </p>
          <p className="text-gray-600">
            {candidate.goalDescription || "Описание отсутствует"}
          </p>
        </div>
        <button className="btn-outline-gray mt-5" onClick={onOpen}>
          Открыть профиль
        </button>
      </div>
    </div>
  )
}

function MiniCandidateCard({
  candidate,
  onClick,
}: {
  candidate: Candidate
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm"
    >
      <div className="flex items-center gap-4">
        <img
          src={candidate.avatar}
          alt={candidate.name}
          className="w-16 h-16 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold truncate">{candidate.name}</h3>
            <span className="text-xs rounded-full bg-[var(--green-light)] px-2 py-1">
              {candidate.compatibility}%
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {candidate.goal || "Цель не указана"}
          </p>
        </div>
      </div>
    </button>
  )
}
