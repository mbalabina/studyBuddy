"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { profileAPI } from "@/lib/api"
import { ChevronLeft } from "lucide-react"
import Image from "next/image"

export default function AboutYouScreen() {
  const { state, setScreen, updateUser } = useApp()
  const step = state.screen

  if (step === "about-congrats") return <CongratsScreen />
  if (step === "about-goal") return <GoalScreen />
  if (step === "new-goal") return <GoalScreen />
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

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    try {
      await profileAPI.updateAboutMe({
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        university: user.university,
        program: user.program,
        course: user.course,
        messengerHandle: user.messengerHandle,
      })
      setScreen("about-congrats")
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
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
              onClick={() => setScreen("about-step2")}
              disabled={!user.firstName || !user.lastName || !user.city}>
              Далее
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
              onClick={() => setScreen("about-step3")}>Далее</button>
            <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              onClick={() => setScreen("about-step1")}>Назад</button>
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
  const { setScreen } = useApp()
  return (
    <div className="flex flex-col min-h-dvh items-center justify-center px-6">
      <Image src="/mascot.png" alt="mascot" width={100} height={100} className="w-24 h-24 mb-6 object-contain" />
      <h2 className="text-2xl font-bold mb-2 text-center">Отлично!</h2>
      <p className="text-sm text-gray-500 text-center mb-8">Теперь давай заполним анкету о твоих предпочтениях</p>
      <button onClick={() => setScreen("survey1")} className="btn-green !w-auto px-8">Дальше</button>
    </div>
  )
}

function GoalScreen() {
  const { state, setScreen, addStudyGoal } = useApp()
  const [goalName, setGoalName] = useState("")
  const [goalDesc, setGoalDesc] = useState("")

  const handleAddGoal = () => {
    if (!goalName.trim()) return
    addStudyGoal({ id: Date.now().toString(), name: goalName, description: goalDesc, startDate: new Date().toLocaleDateString("ru-RU") })
    setGoalName("")
    setGoalDesc("")
    setScreen("main")
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen("main")} className="p-1" aria-label="Back"><ChevronLeft className="w-6 h-6" /></button>
        <span className="text-base font-semibold">Новая цель</span>
        <div className="w-8" />
      </div>
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-center mb-8">Какая у тебя цель?</h2>
        <div className="space-y-5">
          <input type="text" placeholder="Название цели (например, IELTS)" value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base" />
          <textarea placeholder="Описание (опционально)" value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base resize-none" rows={3} />
        </div>
        <div className="mt-auto pb-8 pt-6">
          <button className="w-full py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddGoal} disabled={!goalName.trim()}>Добавить цель</button>
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
