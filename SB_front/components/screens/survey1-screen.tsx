"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
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

export default function Survey1Screen() {
  const { setScreen, updateUser, state } = useApp()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})

  const question = survey1Questions[currentQ]
  const total = survey1Questions.length
  const progress = ((currentQ + 1) / total) * 100

  const currentAnswer = answers[question.id]

  const canProceed = () => {
    if (!currentAnswer) return false
    if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return false
    return true
  }

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Save all answers to user
      updateUser({
        preferredTime: (answers.preferredTime as string[]) || [],
        motivation: (answers.motivation as string[]) || [],
        knowledgeLevel: (answers.knowledgeLevel as string) || "",
        learningStyle: (answers.learningStyle as string[]) || [],
        organization: (answers.organization as number) || 0,
        sociability: (answers.sociability as number) || 0,
        friendliness: (answers.friendliness as number) || 0,
        stressResistance: (answers.stressResistance as number) || 0,
      })
      setScreen("survey2")
    }
  }

  const toggleChip = (option: string) => {
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
    setAnswers({ ...answers, [question.id]: value })
  }

  return (
    <div className="flex flex-col min-h-dvh px-6">
      {/* Header */}
      <div className="flex items-center justify-between h-14 mt-2">
        <button
          onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : setScreen("about-congrats2")}
          className="p-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Анкета совместимости</span>
        <div className="w-8" />
      </div>

      {/* Progress */}
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
        {/* Question card */}
        <div className="bg-[var(--green-light)] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-center leading-snug">{question.title}</h2>
          {question.subtitle && (
            <p className="text-sm text-gray-500 text-center mt-2">{question.subtitle}</p>
          )}
        </div>

        {/* Answer area */}
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
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next button */}
        <div className="mt-auto pb-8 pt-6">
          <button className="btn-green" onClick={handleNext} disabled={!canProceed()}>
            Далее
          </button>
        </div>
      </div>
    </div>
  )
}
