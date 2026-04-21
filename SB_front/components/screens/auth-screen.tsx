"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { useApp } from "@/lib/app-context"
import { profileAPI } from "@/lib/api"
import { ChevronLeft, Camera } from "lucide-react"

const MAX_AVATAR_DATA_URL_LENGTH = 60_000

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("read_failed"))
    reader.readAsDataURL(file)
  })
}

function renderResizedImageToDataUrl(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  outputType: string,
  quality?: number,
): string {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(targetWidth))
  canvas.height = Math.max(1, Math.round(targetHeight))

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("canvas_context_failed")
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  if (typeof quality === "number") {
    return canvas.toDataURL(outputType, quality)
  }

  return canvas.toDataURL(outputType)
}

function resizeToBase64(file: File, maxPx = 1600): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)

    try {
      const original = await readFileAsDataUrl(file)
      if (original.length <= MAX_AVATAR_DATA_URL_LENGTH) {
        resolve(original)
        return
      }

      const img: HTMLImageElement = new window.Image()
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej(new Error("decode_failed"))
        img.src = objectUrl
      })

      if (typeof img.decode === "function") {
        await img.decode().catch(() => undefined)
      }

      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height

      if (!width || !height) {
        throw new Error("empty_image")
      }

      const targetType = file.type === "image/png" ? "image/png" : "image/jpeg"
      const sizeSteps = [maxPx, 1440, 1280, 1120, 960, 840, 768]
      let bestOutput = original

      for (const step of sizeSteps) {
        const scale = Math.min(step / width, step / height, 1)
        const nextWidth = Math.max(1, Math.round(width * scale))
        const nextHeight = Math.max(1, Math.round(height * scale))

        const output = renderResizedImageToDataUrl(
          img,
          nextWidth,
          nextHeight,
          targetType,
          targetType === "image/jpeg" ? 0.98 : undefined,
        )

        bestOutput = output
        if (output.length <= MAX_AVATAR_DATA_URL_LENGTH) {
          resolve(output)
          return
        }
      }

      resolve(bestOutput)
    } catch (error) {
      try {
        const fallback = await readFileAsDataUrl(file)
        resolve(fallback)
      } catch {
        reject(error)
      }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  })
}

export default function AuthScreen() {
  const { login, register, setScreen } = useApp()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Нужен файл изображения")
      event.target.value = ""
      return
    }

    try {
      const base64 = await resizeToBase64(file)
      setAvatarUrl(base64)
    } catch {
      setError("Не удалось обработать фото. Попробуй JPG, PNG или WebP")
    } finally {
      event.target.value = ""
    }
  }

  const openAvatarPicker = () => {
    const input = avatarInputRef.current
    if (!input) return

    if (typeof input.showPicker === "function") {
      input.showPicker()
      return
    }

    input.click()
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return
    setIsLoading(true)
    setError("")

    try {
      if (isRegister) {
        await register(email.trim(), password)
        if (avatarUrl) {
          try {
            await profileAPI.updateAboutMe({ avatarUrl })
          } catch (avatarError) {
            console.error("Failed to save avatar during registration", avatarError)
          }
        }
        // После регистрации идём заполнять профиль
        setScreen("about-step1")
      } else {
        await login(email.trim(), password)
        setScreen("main")
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка"
      if (msg.includes("User already exists")) {
        setError("Пользователь уже существует. Войдите.")
      } else if (msg.includes("User not found") || msg.includes("Invalid password")) {
        setError("Неверный email или пароль")
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center h-14 mt-2">
        {isRegister && (
          <button onClick={() => { setIsRegister(false); setAvatarUrl(""); setError("") }} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-center mb-2">
          {isRegister ? "Регистрация" : "Вход"}
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          {isRegister ? "Создайте аккаунт Study Buddy" : "Войдите в свой аккаунт"}
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-colors bg-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-colors bg-transparent"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Фото профиля <span className="text-gray-400 font-normal">(необязательно)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Предпросмотр фото"
                      onError={(event) => {
                        const image = event.currentTarget
                        if (image.dataset.fallbackApplied === "true") return
                        image.dataset.fallbackApplied = "true"
                        image.src = "/mascot.png"
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/mascot.png" alt="Маскот" className="w-full h-full object-cover" />
                  )}
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={openAvatarPicker}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm hover:border-black transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Выбрать фото
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4 animate-fade-in">{error}</p>
        )}

        <div className="mt-auto pb-8 space-y-3">
          <button
            className="btn-green"
            onClick={handleSubmit}
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? "Загрузка..." : isRegister ? "Зарегистрироваться" : "Войти"}
          </button>

          <button
            className="w-full text-sm text-gray-500 underline text-center"
            onClick={() => { setIsRegister(!isRegister); setAvatarUrl(""); setError("") }}
          >
            {isRegister
              ? "Уже есть аккаунт? Войти"
              : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </div>
      </div>
    </div>
  )
}
