"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { ChevronLeft } from "lucide-react"

const survey2Questions = [
  {
    id: "importantInStudy",
    title: "Что для тебя важно в совместном обучении?",
    type: "multi-chip" as const,
    options: [
      "Регулярность занятий",
      "Спокойная и комфортная атмосфера",
      "Взаимная поддержка и мотивация",
      "Обмен знаниями и опытом",
      "Фокус на результат",
    ],
  },
  {
    id: "additionalGoals",
    title: "Какие дополнительные цели в учебе должны совпадать с твоими?",
    subtitle: "Выбери до 3 вариантов",
    type: "multi-chip" as const,
    maxSelect: 3,
    options: [
      "Регулярность занятий",
      "Спокойная и комфортная атмосфера",
      "Взаимная поддержка и мотивация",
      "Обмен знаниями и опытом",
      "Фокус на результат",
    ],
  },
  {
    id: "partnerLevel",
    title: "Какой уровень подготовки у Study Buddy тебе хочется?",
    type: "single-chip" as const,
    options: ["Такой же, как у меня", "Выше моего, чтобы мог объяснять", "Ниже моего, чтобы я мог объяснять", "Не имеет значения"],
  },
  {
    id: "importantTraits",
    title: "Какие черты тебе наиболее важны в Study Buddy?",
    subtitle: "Выбери до 3 вариантов",
    type: "multi-chip" as const,
    maxSelect: 3,
    options: [
      "Любознательность/креативность",
      "Организованность",
      "Общительность",
      "Стрессоустойчивость",
    ],
  },
  {
    id: "partnerLearningStyle",
    title: "Какой стиль обучения у Study Buddy тебе хочется?",
    type: "multi-chip" as const,
    options: [
      "Чтение и письмо (тексты, конспекты)",
      "Слушание (лекции, аудио)",
      "Визуальные материалы (графики)",
      "Практика (решение задач)",
    ],
  },
]

export default function Survey2Screen() {
  const { state, setScreen, updateUser } = useApp()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  const question = survey2Questions[currentQ]
  const total = survey2Questions.length
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
      updateUser({
        importantInStudy: (answers.importantInStudy as string[]) || [],
        additionalGoals: (answers.additionalGoals as string[]) || [],
        partnerLevel: (answers.partnerLevel as string) || "",
        importantTraits: (answers.importantTraits as string[]) || [],
        partnerLearningStyle: (answers.partnerLearningStyle as string[]) || [],
      })
      // Если firstName уже есть — добавляем новую цель, возвращаемся в поиск
      // Если нет — это первый онбординг, идём на главную
      setScreen(state.user.firstName ? "search-intro" : "main")
    }
  }

  const toggleChip = (option: string) => {
    if (question.type === "single-chip") {
      setAnswers({ ...answers, [question.id]: option })
    } else {
      const current = (answers[question.id] as string[]) || []
      const maxSelect = (question as { maxSelect?: number }).maxSelect
      if (current.includes(option)) {
        setAnswers({ ...answers, [question.id]: current.filter((o) => o !== option) })
      } else {
        if (maxSelect && current.length >= maxSelect) return
        setAnswers({ ...answers, [question.id]: [...current, option] })
      }
    }
  }

  return (
    <div className="flex flex-col min-h-dvh px-6">
      <div className="flex items-center justify-between h-14 mt-2">
        <button
          onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : setScreen("survey1")}
          className="p-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Пожелания к StudyBuddy</span>
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

        <div className="mt-auto pb-8 pt-6">
          <button className="btn-green" onClick={handleNext} disabled={!canProceed()}>
            Далее
          </button>
        </div>
      </div>
    </div>
  )
}
