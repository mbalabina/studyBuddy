"use client"

import { useApp, mockCandidates, type Candidate } from "@/lib/app-context"
import Image from "next/image"
import { ChevronLeft, Plus, Search, Heart, Home } from "lucide-react"
import { TabBar } from "@/components/screens/home-screen"

// ==================== SEARCH INTRO ====================
export default function SearchIntroScreen() {
  const { setScreen, setState } = useApp()

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto">
        {/* Hero card */}
        <div className="relative h-[55vh] overflow-hidden">
          <Image
            src={mockCandidates[0].avatar}
            alt="candidate"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-5 right-5">
            <p className="text-white text-lg font-medium mb-2">
              {"Нашли "}{mockCandidates.length}{" человек для тебя"}
            </p>
          </div>
        </div>

        <div className="px-5 py-6">
          <button
            onClick={() => {
              setState((prev) => ({ ...prev, currentCandidateIndex: 0 }))
              setScreen("search-card")
            }}
            className="btn-green"
          >
            К выбору
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== CANDIDATE CARD (Tinder-like) ====================
export function CandidateCardScreen() {
  const { state, setScreen, likeCurrent, rejectCurrent, setState } = useApp()

  const candidate = mockCandidates[state.currentCandidateIndex]

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-dvh items-center justify-center px-6">
        <Image src="/mascot.png" alt="mascot" width={100} height={100} className="w-24 h-24 mb-4 object-contain" />
        <h2 className="text-xl font-bold mb-2 text-center">Кандидаты закончились</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Мы подберем новых бадди для тебя</p>
        <button onClick={() => setScreen("main")} className="btn-green !w-auto px-8">
          На главную
        </button>
      </div>
    )
  }

  const handleLike = () => {
    setState((prev) => ({
      ...prev,
      matchedCandidate: candidate,
    }))
    likeCurrent()
    setScreen("search-profile")
  }

  const handleSkip = () => {
    rejectCurrent()
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
            <div className="inline-block bg-[var(--green-primary)] text-white text-sm font-bold rounded-full px-3 py-1 mb-2">
              {candidate.compatibility}%
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {candidate.name}
            </h2>
            <p className="text-white/80 text-sm">
              {candidate.age}{" лет \u00B7 "}{candidate.city}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 py-5">
          <button
            onClick={handleSkip}
            className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={handleLike}
            className="w-14 h-14 rounded-full bg-[var(--green-light)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="var(--green-primary)"
                stroke="var(--green-primary)"
                strokeWidth="1.5"
              />
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
  const { state, setScreen } = useApp()
  const candidate = state.matchedCandidate || mockCandidates[0]

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
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Compat badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="bg-[var(--green-primary)] text-white text-sm font-bold rounded-full px-4 py-1.5">
              {candidate.compatibility}%
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-5 py-5">
          <h2 className="text-2xl font-bold text-center mb-1">
            {candidate.name}
          </h2>
          <p className="text-center text-gray-400 text-sm mb-6">
            {candidate.age}{" лет \u00A0\u00A0 "}{candidate.city}
          </p>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-1">{candidate.goal}</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {candidate.goalDescription}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Учится</p>
              <p className="text-sm text-gray-500">
                {candidate.course}{" "}{candidate.university}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-5 pb-8 pt-4 bg-white">
        <button
          onClick={() => setScreen("match-waiting")}
          className="btn-green"
        >
          {"Выбираю "}{candidate.name.split(" ")[0]}
        </button>
      </div>
    </div>
  )
}

// ==================== MATCH WAITING ====================
export function MatchWaitingScreen() {
  const { setScreen } = useApp()

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center px-6 animate-bounce-in">
      <Image
        src="/mascot.png"
        alt="mascot"
        width={120}
        height={120}
        className="w-28 h-28 object-contain mb-6"
      />
      <h2 className="text-2xl font-bold text-center mb-3">Отлично!</h2>
      <p className="text-gray-500 text-center text-sm leading-relaxed mb-8">
        {"Как только бадди подтвердит мэтч,"}
        <br />
        {"вы начнете учиться вместе"}
      </p>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => setScreen("main")}
          className="btn-outline-gray flex-1"
        >
          На главную
        </button>
        <button
          onClick={() => setScreen("match-success")}
          className="btn-green flex-1"
        >
          Хорошо
        </button>
      </div>
    </div>
  )
}

// ==================== MATCH SUCCESS ====================
export function MatchSuccessScreen() {
  const { state, setScreen } = useApp()
  const candidate = state.matchedCandidate || mockCandidates[0]

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-bounce-in">
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-lg text-gray-400 mb-4">Нашлись</p>

        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={candidate.avatar}
              alt={candidate.name}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Мэтч!</h2>
        <p className="text-gray-500 text-center text-sm mb-8">
          Теперь вы StudyBuddy друг друга
        </p>

        {/* Contacts */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={candidate.avatar}
                alt={candidate.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Telegram</p>
              <p className="text-sm font-medium">{candidate.telegram}</p>
            </div>
            <button
              className="text-gray-400 hover:text-black transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(candidate.telegram)
              }}
              aria-label="Copy telegram handle"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="pb-8">
        <button onClick={() => setScreen("main")} className="btn-green">
          Готово
        </button>
      </div>
    </div>
  )
}

// ==================== LIKES SCREEN ====================
export function LikesScreen() {
  const { setScreen } = useApp()

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        <h1 className="text-2xl font-bold mb-2">Поиск Study Buddy</h1>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm underline">IELTS</span>
          <span className="text-sm underline">ЕГЭ химия</span>
          <button className="text-gray-400">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={() => setScreen("likes-candidates")}
            className="btn-green text-left !text-sm"
          >
            Просмотр кандидатов
          </button>
          <p className="text-xs text-gray-400 px-1">
            Посмотри подобранных для тебя кандидатов и найди своего бадди!
          </p>

          <button
            onClick={() => setScreen("likes-candidates")}
            className="btn-green text-left !text-sm"
          >
            Отобрали тебя
          </button>
          <p className="text-xs text-gray-400 px-1">
            Посмотри кто выбрал тебя для совместного обучения!
          </p>

          <button
            onClick={() => setScreen("likes-candidates")}
            className="btn-green text-left !text-sm"
          >
            Отобрал ты
          </button>
          <p className="text-xs text-gray-400 px-1">
            Посмотрите кого ты уже выбрал для совместного обучения!
          </p>
        </div>
      </div>

      <TabBar active="likes" setScreen={setScreen} />
    </div>
  )
}

// ==================== LIKES CANDIDATES LIST ====================
export function LikesCandidatesScreen() {
  const { setScreen, setState } = useApp()

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setScreen("likes")} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <h1 className="text-xl font-bold mb-1">Ждем ответа</h1>
        <p className="text-lg font-semibold mb-5">IELTS</p>

        {/* Candidates list */}
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
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--green-light)]"
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
                  {c.age}{" лет, "}{c.city}
                </p>
              </div>
              <span className="text-lg font-bold">{c.compatibility}%</span>
            </button>
          ))}
        </div>
      </div>

      <TabBar active="likes" setScreen={setScreen} />
    </div>
  )
}
