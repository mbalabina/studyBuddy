"use client"

import { useState } from "react"
import { useApp, type AppScreen } from "@/lib/app-context"
import { ChevronLeft } from "lucide-react"
import Image from "next/image"

export default function AboutYouScreen() {
  const { state, setScreen } = useApp()
  const step = state.screen

  if (step === "about-congrats") return <CongratsScreen />
  if (step === "about-goal") return <GoalScreen backTo="about-congrats" nextTo="about-congrats2" />
  if (step === "new-goal") return <GoalScreen backTo="search-intro" nextTo="survey2" />
  if (step === "about-congrats2") return <Congrats2Screen />

  return <AboutFormSteps />
}

function AboutFormSteps() {
  const { state, setScreen, updateUser } = useApp()
  const step = state.screen as "about-step1" | "about-step2" | "about-step3"
  const user = state.user

  const prevScreen =
    step === "about-step1" ? "auth" : step === "about-step2" ? "about-step1" : "about-step2"

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen(prevScreen)} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Анкета о тебе</span>
        <div className="w-8" />
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
            <input
              type="text"
              placeholder="Твое имя"
              value={user.firstName}
              onChange={(e) => updateUser({ firstName: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base"
            />
            <input
              type="text"
              placeholder="Фамилия"
              value={user.lastName}
              onChange={(e) => updateUser({ lastName: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base"
            />
            <input
              type="text"
              placeholder="Город"
              value={user.city}
              onChange={(e) => updateUser({ city: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base"
            />
          </div>

          <div className="mt-6">
            <div className="toggle-pill">
              <button
                className={user.role === "student" ? "active" : ""}
                onClick={() => updateUser({ role: "student" })}
              >
                Я студент
              </button>
              <button
                className={user.role === "pupil" ? "active" : ""}
                onClick={() => updateUser({ role: "pupil" })}
              >
                Я ученик
              </button>
            </div>
          </div>

          <div className="mt-auto pb-8 pt-6">
            <button
              className="btn-green"
              onClick={() => setScreen("about-step2")}
              disabled={!user.firstName || !user.lastName}
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {step === "about-step2" && (
        <div className="flex-1 flex flex-col animate-slide-in-right">
          <h2 className="text-2xl font-bold text-center mb-2">Привет</h2>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
            Расскажи нам о себе, чтобы мы лучше понимали, с кем тебе будет комфортно учиться
          </p>

          <div className="space-y-5">
            <div className="toggle-pill mb-4">
              <button
                className={user.role === "student" ? "active" : ""}
                onClick={() => updateUser({ role: "student" })}
              >
                Я студент
              </button>
              <button
                className={user.role === "pupil" ? "active" : ""}
                onClick={() => updateUser({ role: "pupil" })}
              >
                Я ученик
              </button>
            </div>

            <input
              type="text"
              placeholder="Название университета"
              value={user.university}
              onChange={(e) => updateUser({ university: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base"
            />
            <input
              type="text"
              placeholder="Программа обучения"
              value={user.program}
              onChange={(e) => updateUser({ program: e.target.value })}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base"
            />

            <CourseSelector
              value={user.course}
              onChange={(course) => updateUser({ course })}
            />
          </div>

          <div className="mt-auto pb-8 pt-6">
            <button className="btn-green" onClick={() => setScreen("about-step3")}>
              Далее
            </button>
          </div>
        </div>
      )}

      {step === "about-step3" && (
        <div className="flex-1 flex flex-col animate-slide-in-right">
          <h2 className="text-2xl font-bold text-center mb-2">Тг или вк?</h2>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
            Выбери предпочтительный мессенджер для общения со Study Buddy
          </p>

          <div className="toggle-pill mb-8">
            <button
              className={user.messenger === "telegram" ? "active" : ""}
              onClick={() => updateUser({ messenger: "telegram" })}
            >
              Telegram
            </button>
            <button
              className={user.messenger === "vk" ? "active" : ""}
              onClick={() => updateUser({ messenger: "vk" })}
            >
              VK
            </button>
          </div>

          <input
            type="text"
            placeholder={user.messenger === "telegram" ? "@username" : "vk.com/id"}
            value={user.messengerHandle}
            onChange={(e) => updateUser({ messengerHandle: e.target.value })}
            className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-colors text-base"
          />

          <div className="mt-auto pb-8 pt-6">
            <button
              className="btn-green"
              onClick={() => setScreen("about-congrats")}
              disabled={!user.messengerHandle}
            >
              Далее
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CourseSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const courses = ["1 курс", "2 курс", "3 курс", "4 курс", "5 курс"]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 border-b border-gray-200 text-base"
      >
        <span className={value ? "text-black" : "text-gray-400"}>{value || "Курс"}</span>
        <ChevronLeft className="w-4 h-4 -rotate-90 text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg overflow-hidden">
          {courses.map((c) => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${value === c ? "bg-[var(--green-light)] font-semibold" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CongratsScreen() {
  const { setScreen } = useApp()

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 animate-bounce-in">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-48 h-48 relative mb-6">
          <Image src="/mascot.png" alt="Mascot" fill className="object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-3">Отлично!</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed max-w-[260px]">
          Теперь мы знаем, как тебя зовут. Расскажи о своей цели, которую ты хочешь достичь со Study Buddy.
        </p>
      </div>
      <div className="w-full pb-8 flex gap-3">
        <button className="btn-outline-gray flex-1" onClick={() => setScreen("main")}>Позже</button>
        <button className="btn-green flex-1" onClick={() => setScreen("about-goal")}>Далее</button>
      </div>
    </div>
  )
}

function GoalScreen({ backTo, nextTo }: { backTo: AppScreen; nextTo: AppScreen }) {
  const { setScreen, addStudyGoal } = useApp()
  const [goalName, setGoalName] = useState("")
  const [goalDesc, setGoalDesc] = useState("")

  const goalOptions = ["Языковой экзамен", "ЕГЭ", "Поступление", "Стажировка", "Другое"]

  const handleNext = () => {
    if (goalName) {
      addStudyGoal({
        id: Date.now().toString(),
        name: goalName,
        description: goalDesc,
        startDate: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
      })
    }
    setScreen(nextTo)
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center justify-between h-14 mt-2">
        <button onClick={() => setScreen(backTo)} className="p-1" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold">Анкета о тебе</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-center mb-2">Поставь цели</h2>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          Расскажи, что бы ты хотел изучать вместе со своим бадди. Опиши подробно, к чему хочешь подготовиться и что будешь изучать.
        </p>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <select
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl text-base appearance-none bg-white focus:border-black outline-none transition-colors"
            >
              <option value="">Твоя учебная цель</option>
              {goalOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-gray-400 pointer-events-none" />
          </div>

          <textarea
            placeholder="Опиши подробности для напарника"
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            rows={3}
            className="w-full py-3 px-4 border border-gray-200 rounded-xl text-base resize-none focus:border-black outline-none transition-colors"
          />
        </div>

        <div className="mt-auto pb-8 flex gap-3">
          <button className="btn-outline-gray flex-1" onClick={() => setScreen(nextTo)}>
            Позже
          </button>
          <button className="btn-green flex-1" onClick={handleNext}>
            Далее
          </button>
        </div>
      </div>
    </div>
  )
}

function Congrats2Screen() {
  const { setScreen } = useApp()

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 animate-bounce-in">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-48 h-48 relative mb-6">
          <Image src="/mascot.png" alt="Mascot" fill className="object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-3">Отлично!</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed max-w-[260px]">
          Осталось заполнить свои предпочтения по стилю обучения и пожелания к бадди
        </p>
      </div>
      <div className="w-full pb-8 flex gap-3">
        <button className="btn-outline-gray flex-1" onClick={() => setScreen("main")}>
          Позже
        </button>
        <button className="btn-green flex-1" onClick={() => setScreen("survey1")}>
          Далее
        </button>
      </div>
    </div>
  )
}
