"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, Camera, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { profileAPI } from "@/lib/api"
import type React from "react"

interface FormState {
  firstName: string
  lastName: string
  city: string
  university: string
  program: string
  course: string
  messengerHandle: string
  studyGoal: string
  avatarUrl: string
}

const empty: FormState = {
  firstName: "",
  lastName: "",
  city: "",
  university: "",
  program: "",
  course: "",
  messengerHandle: "",
  studyGoal: "",
  avatarUrl: "",
}

function resizeToBase64(file: File, maxPx = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img")
    const canvas = document.createElement("canvas")
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.82))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profileAPI
      .getMe()
      .then((data: any) => {
        const p = data?.profile ?? {}
        const u = data?.user ?? {}
        setForm({
          firstName:       p.firstName       ?? "",
          lastName:        p.lastName        ?? "",
          city:            p.city            ?? "",
          university:      p.university      ?? "",
          program:         p.program         ?? "",
          course:          p.course          ?? "",
          messengerHandle: p.messengerHandle ?? u.telegramUsername ?? "",
          studyGoal:       p.studyGoal       ?? "",
          avatarUrl:       p.avatarUrl       ?? "",
        })
      })
      .catch(() => setError("Не удалось загрузить профиль"))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await resizeToBase64(file)
      setForm((prev) => ({ ...prev, avatarUrl: base64 }))
    } catch {
      setError("Не удалось обработать фото")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await profileAPI.updateAboutMe({
        firstName:       form.firstName,
        lastName:        form.lastName,
        city:            form.city,
        university:      form.university,
        program:         form.program,
        course:          form.course,
        messengerHandle: form.messengerHandle,
        studyGoal:       form.studyGoal,
        avatarUrl:       form.avatarUrl,
      })
      router.push("/")
    } catch (e: any) {
      setError(e?.message ?? "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[430px] min-h-dvh bg-white relative overflow-hidden shadow-2xl flex flex-col">
      <div className="flex items-center h-14 mt-2 px-6 shrink-0">
        <button onClick={() => router.push("/")} className="p-1" aria-label="Назад">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-base font-semibold flex-1 text-center">Редактировать</span>
        <div className="w-8" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="flex flex-col items-center pt-4 pb-6 px-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden">
                  {form.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatarUrl}
                      alt="Фото профиля"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/placeholder-user.jpg"
                      alt="Фото профиля"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-black rounded-full flex items-center justify-center"
                  aria-label="Изменить фото"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            <Section title="Личные данные">
              <Field label="Имя"     value={form.firstName} onChange={set("firstName")} />
              <Field label="Фамилия" value={form.lastName}  onChange={set("lastName")} />
              <Field label="Город"   value={form.city}      onChange={set("city")} />
            </Section>

            <Section title="Образование">
              <Field label="Университет" value={form.university} onChange={set("university")} />
              <Field label="Программа"   value={form.program}   onChange={set("program")} />
              <Field label="Курс"        value={form.course}    onChange={set("course")} />
            </Section>

            <Section title="Цель обучения">
              <Field label="Цель" value={form.studyGoal} onChange={set("studyGoal")} />
            </Section>

            <Section title="Контакты">
              <Field label="Telegram / ВКонтакте" value={form.messengerHandle} onChange={set("messengerHandle")} />
            </Section>

            {error && <p className="mx-6 mt-2 text-xs text-red-500">{error}</p>}
          </div>

          <div className="px-6 pb-8 pt-3 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
        {title}
      </p>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="py-1">
      <p className="text-xs text-gray-400 mt-2">{label}</p>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full py-2 border-b border-gray-200 focus:border-black outline-none transition-colors text-sm font-medium bg-transparent"
      />
    </div>
  )
}