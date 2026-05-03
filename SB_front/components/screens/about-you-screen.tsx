"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { profileAPI } from "@/lib/api"
import { ChevronLeft } from "lucide-react"
import Image from "next/image"

export default function AboutYouScreen() {
  const { state, setScreen, updateUser } = useApp()
  const step = state.screen

  if (step === "about-congrats") return <CongratsScreen />
  if (step === "about-goal") return <GoalScreen backTo="about-step3" nextTo="about-congrats" />
  if (step === "new-goal") return <GoalScreen backTo="main" nextTo="main" />
  if (step === "about-congrats2") return <Congrats2Screen />

  return <AboutFormSteps />
}

function AboutFormSteps() {
  const { state, setScreen, updateUser } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const step = state.screen as "about-step1" | "about-step2" | "about-step3"
  const user = state.user

  const stepNum = step === "about-step1" ? 1 : step === "about-step2" ? 2 : 3
  const prevScreen =
    step === "about-step1" ? "auth" : step === "about-step2" ? "about-step1" : "about-step2"

  const persistProgress = async (payload: Parameters<typeof profileAPI.updateAboutMe>[0]) => {
    await profileAPI.updateAboutMe(payload)
  }

  const handleStep1Next = async () => {
    setLoading(true)
    setError(null)
    try {
      await persistProgress({
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age ?? undefined,
        city: user.city,
        onboardingStep: "about-step2",
      })
      updateUser({ onboardingStep: "about-step2" })
      setScreen("about-step2")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Next = async () => {
    setLoading(true)
    setError(null)
    try {
      await persistProgress({
        university: user.university,
        program: user.program,
        course: user.course,
        onboardingStep: "about-step3",
      })
      updateUser({ onboardingStep: "about-step3" })
      setScreen("about-step3")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    try {
      await persistProgress({
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age ?? undefined,
        city: user.city,
        university: user.university,
        program: user.program,
        course: user.course,
        messengerHandle: user.messengerHandle,
        onboardingStep: "about-goal",
      })
      updateUser({ onboardingStep: "about-goal" })
      setScreen("about-goal")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen(prevScreen)} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Анкета о тебе</span>
        <div className="w-8" />
      </div>

      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= stepNum ? "bg-black" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-center my-4">
        <div className="w-16 h-16 relative">
          <Image src="/mascot.png" alt="Mascot" fill className="object-contain" />
        </div>
      </div>

      {step === "about-step1" && (
        <div className="flex-1 flex flex-col animate-slide-in-right">
          <h2 className="text-2xl font-bold text-center mb-2">Привет</h2>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
            Расскажи нам о себе, чтобы мы лучше понимали, с кем тебе будет комфортно учиться
          </p>
          <div className="space-y-5">
            <input type="text" placeholder="Твое имя" value={user.firstName}
              onChange={(e) => updateUser({ firstName: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
            <input type="text" placeholder="Фамилия" value={user.lastName}
              onChange={(e) => updateUser({ lastName: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
            <input type="text" placeholder="Город" value={user.city}
              onChange={(e) => updateUser({ city: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
            <input type="number" placeholder="Возраст" value={user.age ?? ""}
              onChange={(e) => updateUser({ age: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
            <div className="pt-4">
              <p className="text-sm font-semibold mb-3">Кто ты?</p>
              <div className="flex gap-3">
                <button onClick={() => updateUser({ role: "student" })}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${user.role === "student" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Я студент
                </button>
                <button onClick={() => updateUser({ role: "pupil" })}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${user.role === "pupil" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Я ученик
                </button>
              </div>
            </div>
          </div>
          <div className="mt-auto pb-8 pt-6">
            <button className="w-full py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void handleStep1Next()}
              disabled={!user.firstName || !user.lastName || !user.city || loading}>
              {loading ? "Сохраняем..." : "Далее"}
            </button>
          </div>
        </div>
      )}

      {step === "about-step2" && (
        <div className="flex-1 flex flex-col animate-slide-in-right">
          <h2 className="text-2xl font-bold text-center mb-2">Образование</h2>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">Расскажи о своем образовании</p>
          <div className="space-y-5">
            {user.role !== "pupil" ? (
              <>
                <input type="text" placeholder="Название университета" value={user.university}
                  onChange={(e) => updateUser({ university: e.target.value })}
                  className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
                <input type="text" placeholder="Программа обучения" value={user.program}
                  onChange={(e) => updateUser({ program: e.target.value })}
                  className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
                <CourseSelector value={user.course} onChange={(course) => updateUser({ course })} />
              </>
            ) : (
              <input type="text" placeholder="Школа / класс" value={user.university}
                onChange={(e) => updateUser({ university: e.target.value })}
                className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
            )}
          </div>
          <div className="mt-auto pb-8 pt-6 space-y-3">
            <button className="w-full py-3 bg-black text-white rounded-xl font-semibold"
              onClick={() => void handleStep2Next()}
              disabled={loading}>
              {loading ? "Сохраняем..." : "Далее"}
            </button>
            <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              onClick={() => setScreen("about-step1")}
              disabled={loading}>
              Назад
            </button>
          </div>
        </div>
      )}

      {step === "about-step3" && (
        <div className="flex-1 flex flex-col animate-slide-in-right">
          <h2 className="text-2xl font-bold text-center mb-2">Контакты</h2>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">Как с тобой связаться?</p>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold mb-3">Мессенджер</p>
              <div className="flex gap-3">
                <button onClick={() => updateUser({ messenger: "telegram" })}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${user.messenger === "telegram" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Telegram
                </button>
                <button onClick={() => updateUser({ messenger: "vk" })}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${user.messenger === "vk" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  VK
                </button>
              </div>
            </div>
            <input type="text"
              placeholder={user.messenger === "telegram" ? "@username" : "vk.com/username"}
              value={user.messengerHandle}
              onChange={(e) => updateUser({ messengerHandle: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
          </div>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          <div className="mt-auto pb-8 pt-6 space-y-3">
            <button className="w-full py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleFinish}
              disabled={!user.messengerHandle || loading}>
              {loading ? "Сохраняем..." : "Готово"}
            </button>
            <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              onClick={() => setScreen("about-step2")}>Назад</button>
          </div>
        </div>
      )}
    </div>
  )
}

function CourseSelector({ value, onChange }: { value: string; onChange: (course: string) => void }) {
  const courses = ["1 курс", "2 курс", "3 курс", "4 курс", "5 курс", "6 курс"]
  return (
    <div>
      <p className="text-sm font-semibold mb-2">Курс</p>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full py-3 px-4 border border-gray-200 rounded-lg focus:border-black outline-none transition-colors text-base">
        {courses.map((course) => (
          <option key={course} value={course}>{course}</option>
        ))}
      </select>
    </div>
  )
}

function CongratsScreen() {
  const { setScreen, updateUser } = useApp()
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    setLoading(true)
    try {
      await profileAPI.updateAboutMe({ onboardingStep: "survey1" })
      updateUser({ onboardingStep: "survey1" })
      setScreen("survey1")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center px-6">
      <Image src="/mascot.png" alt="mascot" width={100} height={100} className="w-24 h-24 mb-6 object-contain" />
      <h2 className="text-2xl font-bold mb-2 text-center">Отлично!</h2>
      <p className="text-sm text-gray-500 text-center mb-8">Теперь давай заполним анкету о твоих предпочтениях</p>
      <button onClick={() => void handleNext()} disabled={loading} className="btn-green !w-auto px-8">
        {loading ? "Сохраняем..." : "Дальше"}
      </button>
    </div>
  )
}

function GoalScreen({ backTo, nextTo }: { backTo: string; nextTo: string }) {
  const { state, setScreen, addStudyGoal, updateStudyGoal, updateUser } = useApp()
  const [goalName, setGoalName] = useState("")
  const [goalLanguage, setGoalLanguage] = useState("")
  const [goalDesc, setGoalDesc] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const languageGoalName = "Изучение языка"
  const goalOptions = [languageGoalName, "Языковой экзамен", "ЕГЭ", "ОГЭ", "Поступление", "Стажировка", "Другое"]
  const languageOptions = [
    "Английский",
    "Немецкий",
    "Французский",
    "Испанский",
    "Итальянский",
    "Китайский",
    "Японский",
    "Корейский",
    "Арабский",
    "Русский",
  ]

  const isStandaloneGoalScreen = state.screen === "new-goal"
  const editingGoalId = isStandaloneGoalScreen ? state.goalEditor.goalId : null
  const editingGoal =
    typeof editingGoalId === "number"
      ? state.user.studyGoals.find((goal) => goal.id === editingGoalId) ?? null
      : null
  const isEditing = Boolean(editingGoal)

  useEffect(() => {
    if (!isStandaloneGoalScreen) return

    if (editingGoal) {
      setGoalName(editingGoal.name || "")
      setGoalLanguage(editingGoal.language || "")
      setGoalDesc(editingGoal.description || "")
      setError(null)
      return
    }

    setGoalName("")
    setGoalLanguage("")
    setGoalDesc("")
    setError(null)
  }, [editingGoal, isStandaloneGoalScreen])

  const handleNext = async () => {
    if (!goalName) {
      if (isEditing) {
        setError("Выбери цель")
        return
      }
      setScreen(nextTo as any)
      return
    }
    if (goalName === languageGoalName && !goalLanguage.trim()) {
      setError("Выбери язык для цели «Изучение языка»")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (isEditing && editingGoalId) {
        await updateStudyGoal(editingGoalId, {
          name: goalName,
          description: goalDesc,
          language: goalName === languageGoalName ? goalLanguage : "",
          startDate: editingGoal?.startDate || "",
          isActive: editingGoal?.isActive ?? false,
        })
        setScreen("main")
        return
      }

      await addStudyGoal({
        name: goalName,
        description: goalDesc,
        language: goalName === languageGoalName ? goalLanguage : "",
        startDate: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
      })
      const onboardingStep = nextTo === "about-congrats" ? "about-congrats" : "main"
      await profileAPI.updateAboutMe({ onboardingStep })
      updateUser({ onboardingStep })
      setScreen(nextTo as any)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось добавить цель")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen(backTo as any)} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">{isStandaloneGoalScreen ? "Учебная цель" : "Анкета о тебе"}</span>
        <div className="w-8" />
      </div>
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-center mb-2">{isEditing ? "Редактируй цель" : "Поставь цели"}</h2>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          Расскажи, что бы ты хотел изучать вместе со своим бадди.
        </p>
        <div className="space-y-4 mb-6">
          <div className="relative">
            <select
              value={goalName}
              onChange={(e) => {
                const value = e.target.value
                setGoalName(value)
                if (value !== languageGoalName) {
                  setGoalLanguage("")
                }
              }}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl text-base appearance-none bg-white focus:border-black outline-none transition-colors">
              <option value="">Твоя учебная цель</option>
              {goalOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-gray-400 pointer-events-none" />
          </div>
          {goalName === languageGoalName && (
            <div className="relative">
              <select
                value={goalLanguage}
                onChange={(e) => setGoalLanguage(e.target.value)}
                className="w-full py-3 px-4 border border-gray-200 rounded-xl text-base appearance-none bg-white focus:border-black outline-none transition-colors"
              >
                <option value="">Какой язык хочешь изучать?</option>
                {languageOptions.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-gray-400 pointer-events-none" />
            </div>
          )}
          <textarea placeholder="Описание (опционально)" value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base resize-none" rows={3} />
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <div className="mt-auto pb-8 pt-6">
          <button className="w-full py-3 bg-black text-white rounded-xl font-semibold"
            onClick={() => void handleNext()}
            disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : isEditing ? "Сохранить" : "Далее"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Congrats2Screen() {
  const { setScreen } = useApp()
  return (
    <div className="flex flex-col min-h-dvh items-center justify-center px-6">
      <Image src="/mascot.png" alt="mascot" width={100} height={100} className="w-24 h-24 mb-6 object-contain" />
      <h2 className="text-2xl font-bold mb-2 text-center">Готово!</h2>
      <p className="text-sm text-gray-500 text-center mb-8">Теперь ты можешь начать искать бадди</p>
      <button onClick={() => setScreen("main")} className="btn-green !w-auto px-8">На главную</button>
    </div>
  )
}
