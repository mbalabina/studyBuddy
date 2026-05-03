"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/lib/app-context"
import { profileAPI } from "@/lib/api"
import { ChevronLeft } from "lucide-react"
import { trackSurvey2Complete } from "@/lib/yandex-metrika"

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

function hasAnswer(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.length > 0
  return Boolean((value ?? "").trim())
}

export default function Survey2Screen() {
  const { state, setScreen, updateUser, saveProfile, savePreferences, loadCandidates } = useApp()
  const draftKey = useMemo(() => {
    const userKey = typeof state.authUserId === "number" && state.authUserId > 0
      ? `uid:${state.authUserId}`
      : state.authEmail?.trim().toLowerCase()
        ? `email:${state.authEmail.trim().toLowerCase()}`
        : ""
    return userKey ? `studybuddy_survey2_q_v1:${userKey}` : ""
  }, [state.authEmail, state.authUserId])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => ({
    importantInStudy: state.user.importantInStudy,
    additionalGoals: state.user.additionalGoals,
    partnerLevel: state.user.partnerLevel,
    importantTraits: state.user.importantTraits,
    partnerLearningStyle: state.user.partnerLearningStyle,
  }))

  const [currentQ, setCurrentQ] = useState(() => {
    if (typeof window !== "undefined" && draftKey) {
      const fromStorage = Number(window.localStorage.getItem(draftKey))
      if (Number.isInteger(fromStorage) && fromStorage >= 0 && fromStorage < survey2Questions.length) {
        return fromStorage
      }
    }

    const index = survey2Questions.findIndex((question) => {
      const value = answersFromState(state.user)[question.id]
      return !hasAnswer(value)
    })
    return index >= 0 ? index : survey2Questions.length - 1
  })

  useEffect(() => {
    if (!draftKey) return
    const fromStorage = Number(window.localStorage.getItem(draftKey))
    if (Number.isInteger(fromStorage) && fromStorage >= 0 && fromStorage < survey2Questions.length) {
      setCurrentQ(fromStorage)
    }
  }, [draftKey])

  useEffect(() => {
    if (!draftKey) return
    window.localStorage.setItem(draftKey, String(currentQ))
  }, [currentQ, draftKey])

  const question = survey2Questions[currentQ]
  const total = survey2Questions.length
  const progress = ((currentQ + 1) / total) * 100
  const currentAnswer = answers[question.id]

  const finalPreferenceUpdates = {
    importantInStudy: (answers.importantInStudy as string[]) || [],
    additionalGoals: (answers.additionalGoals as string[]) || [],
    partnerLevel: (answers.partnerLevel as string) || "",
    importantTraits: (answers.importantTraits as string[]) || [],
    partnerLearningStyle: (answers.partnerLearningStyle as string[]) || [],
  }

  const canProceed = () => hasAnswer(currentAnswer as string | string[] | undefined)

  const persistCurrentAnswer = async (nextStep: string) => {
    if (question.id === "partnerLevel") {
      await savePreferences({
        partnerLevel: (currentAnswer as string) || "",
      })
      await profileAPI.updateAboutMe({ onboardingStep: nextStep })
      return
    }

    await profileAPI.updateAboutMe({
      [question.id]: currentAnswer,
      onboardingStep: nextStep,
    })
  }

  const handleNext = async () => {
    if (!canProceed()) return

    const isLastQuestion = currentQ === total - 1
    const finalScreen = state.user.firstName ? "search-intro" : "main"
    const nextStep = isLastQuestion ? finalScreen : "survey2"

    setSaving(true)
    setError(null)

    try {
      await persistCurrentAnswer(nextStep)
      updateUser({
        [question.id]: currentAnswer,
        onboardingStep: nextStep,
      } as any)

      if (!isLastQuestion) {
        setCurrentQ(currentQ + 1)
        return
      }

      updateUser(finalPreferenceUpdates)
      await saveProfile({ ...finalPreferenceUpdates, onboardingStep: nextStep })
      await savePreferences(finalPreferenceUpdates)
      await loadCandidates()
      if (draftKey) {
        window.localStorage.removeItem(draftKey)
      }
      trackSurvey2Complete()
      setScreen(finalScreen)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить анкету")
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
    setError(null)

    try {
      await profileAPI.updateAboutMe({ onboardingStep: "survey1" })
      if (draftKey) {
        window.localStorage.removeItem(draftKey)
      }
      updateUser({ onboardingStep: "survey1" })
      setScreen("survey1")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось вернуться")
    } finally {
      setSaving(false)
    }
  }

  const toggleChip = (option: string) => {
    if (saving) return

    if (question.type === "single-chip") {
      setAnswers({ ...answers, [question.id]: option })
      updateUser({ [question.id]: option } as any)
    } else {
      const current = (answers[question.id] as string[]) || []
      const maxSelect = (question as { maxSelect?: number }).maxSelect
      if (current.includes(option)) {
        const nextValue = current.filter((o) => o !== option)
        setAnswers({ ...answers, [question.id]: nextValue })
        updateUser({ [question.id]: nextValue } as any)
      } else {
        if (maxSelect && current.length >= maxSelect) return
        const nextValue = [...current, option]
        setAnswers({ ...answers, [question.id]: nextValue })
        updateUser({ [question.id]: nextValue } as any)
      }
    }
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
                disabled={saving}
              >
                {opt}
              </button>
            )
          })}
        </div>

        <div className="mt-auto pb-8 pt-6">
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <button className="btn-green" onClick={() => void handleNext()} disabled={!canProceed() || saving}>
            {saving ? "Сохраняем..." : "Далее"}
          </button>
        </div>
      </div>
    </div>
  )
}

function answersFromState(user: ReturnType<typeof useApp>["state"]["user"]): Record<string, string | string[] | undefined> {
  return {
    importantInStudy: user.importantInStudy,
    additionalGoals: user.additionalGoals,
    partnerLevel: user.partnerLevel,
    importantTraits: user.importantTraits,
    partnerLearningStyle: user.partnerLearningStyle,
  }
}
