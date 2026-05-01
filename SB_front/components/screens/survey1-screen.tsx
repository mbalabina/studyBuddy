"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { profileAPI } from "@/lib/api"
import { ChevronLeft } from "lucide-react"

// Survey 1: Анкета совместимости (8 questions)
const survey1Questions = [
  {
    id: "preferredTime",
    title: "В какое время тебе удобнее всего заниматься?",
    subtitle: "Уточните, если это зависит от дня недели",
    type: "multi-chip" as const,
    options: ["Утро", "День", "Вечер", "Ночь", "Зависит от дня недели"],
  },
  {
    id: "motivation",
    title: "Что тебя мотивирует учиться?",
    type: "multi-chip" as const,
    options: [
      "Внутренний интерес к теме",
      "Желание достичь конкретной цели",
      "Поддержка и одобрение окружающих",
      "Страх неудачи",
    ],
  },
  {
    id: "knowledgeLevel",
    title: "Оцени свой текущий уровень знаний в выбранной области",
    type: "single-chip" as const,
    options: ["Только начинаю", "Базовое понимание", "Глубоко погружен в тему"],
  },
  {
    id: "learningStyle",
    title: "Как тебе проще всего усваивать информацию?",
    type: "multi-chip" as const,
    options: [
      "Чтение и письмо (тексты, конспекты)",
      "Слушание (лекции, аудио)",
      "Визуальные материалы (графики)",
      "Практика (решение задач)",
    ],
  },
  {
    id: "organization",
    title: "Как ты оцениваешь свою организованность?",
    type: "rating" as const,
  },
  {
    id: "sociability",
    title: "Как ты оцениваешь свою общительность?",
    type: "rating" as const,
  },
  {
    id: "friendliness",
    title: "Как ты оцениваешь свою доброжелательность?",
    type: "rating" as const,
  },
  {
    id: "stressResistance",
    title: "Как ты оцениваешь свою стрессоустойчивость?",
    type: "rating" as const,
  },
]

function hasAnswer(value: string | string[] | number | undefined) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "number") return value > 0
  return Boolean((value ?? "").trim())
}

export default function Survey1Screen() {
  const { setScreen, updateUser, state } = useApp()
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>(() => ({
    preferredTime: state.user.preferredTime,
    motivation: state.user.motivation,
    knowledgeLevel: state.user.knowledgeLevel,
    learningStyle: state.user.learningStyle,
    organization: state.user.organization,
    sociability: state.user.sociability,
    friendliness: state.user.friendliness,
    stressResistance: state.user.stressResistance,
  }))

  const [currentQ, setCurrentQ] = useState(() => {
    const index = survey1Questions.findIndex((question) => {
      const value = answersFromState(state.user)[question.id]
      return !hasAnswer(value)
    })
    return index >= 0 ? index : survey1Questions.length - 1
  })

  const question = survey1Questions[currentQ]
  const total = survey1Questions.length
  const progress = ((currentQ + 1) / total) * 100

  const currentAnswer = answers[question.id]

  const canProceed = () => hasAnswer(currentAnswer as string | string[] | number | undefined)

  const handleNext = async () => {
    if (!canProceed()) return

    const nextScreen = currentQ < total - 1 ? "survey1" : "survey2"

    setSaving(true)
    try {
      await profileAPI.updateAboutMe({
        [question.id]: currentAnswer,
        onboardingStep: nextScreen,
      })

      updateUser({
        [question.id]: currentAnswer,
        onboardingStep: nextScreen,
      } as any)

      if (currentQ < total - 1) {
        setCurrentQ(currentQ + 1)
      } else {
        setScreen("survey2")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBack = async () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
      return
    }

    setSaving(true)
    try {
      await profileAPI.updateAboutMe({ onboardingStep: "about-congrats2" })
      updateUser({ onboardingStep: "about-congrats2" })
      setScreen("about-congrats2")
    } finally {
      setSaving(false)
    }
  }

  const toggleChip = (option: string) => {
    if (saving) return

    if (question.type === "single-chip") {
      setAnswers({ ...answers, [question.id]: option })
    } else {
      const current = (answers[question.id] as string[]) || []
      if (current.includes(option)) {
        setAnswers({ ...answers, [question.id]: current.filter((o) => o !== option) })
      } else {
        setAnswers({ ...answers, [question.id]: [...current, option] })
      }
    }
  }

  const setRating = (value: number) => {
    if (saving) return
    setAnswers({ ...answers, [question.id]: value })
  }

  return (
    <div className="flex flex-col min-h-dvh px-6">
      <div className="flex items-center justify-between h-14 mt-2">
        <button
          onClick={() => void handleBack()}
          className="p-1"
          aria-label="Back"
          disabled={saving}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Анкета совместимости</span>
        <div className="w-8" />
      </div>

      <div className="progress-bar mt-2 mb-6">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className="text-sm text-gray-400 mb-4">
        {"Вопрос "}
        {currentQ + 1}
        {" из "}
        {total}
      </p>

      <div className="flex-1 flex flex-col animate-fade-in" key={currentQ}>
        <div className="bg-[var(--green-light)] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-center leading-snug">{question.title}</h2>
          {question.subtitle && (
            <p className="text-sm text-gray-500 text-center mt-2">{question.subtitle}</p>
          )}
        </div>

        {(question.type === "multi-chip" || question.type === "single-chip") && question.options && (
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = question.type === "single-chip"
                ? currentAnswer === opt
                : Array.isArray(currentAnswer) && currentAnswer.includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => toggleChip(opt)}
                  className={`option-chip w-full text-left ${isSelected ? "selected" : ""}`}
                  disabled={saving}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {question.type === "rating" && (
          <div className="flex justify-center">
            <div className="rating-scale">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`rating-btn ${currentAnswer === n ? "selected" : ""}`}
                  disabled={saving}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pb-8 pt-6">
          <button className="btn-green" onClick={() => void handleNext()} disabled={!canProceed() || saving}>
            {saving ? "Сохраняем..." : "Далее"}
          </button>
        </div>
      </div>
    </div>
  )
}

function answersFromState(user: ReturnType<typeof useApp>["state"]["user"]): Record<string, string | string[] | number | undefined> {
  return {
    preferredTime: user.preferredTime,
    motivation: user.motivation,
    knowledgeLevel: user.knowledgeLevel,
    learningStyle: user.learningStyle,
    organization: user.organization,
    sociability: user.sociability,
    friendliness: user.friendliness,
    stressResistance: user.stressResistance,
  }
}
