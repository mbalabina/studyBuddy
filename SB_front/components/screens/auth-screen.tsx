"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { useApp } from "@/lib/app-context"
import { authAPI, profileAPI } from "@/lib/api"
import { ChevronLeft, Camera } from "lucide-react"
import { trackRegistrationComplete } from "@/lib/yandex-metrika"

const MAX_AVATAR_DATA_URL_LENGTH = 2_000_000

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

function isLossyImageType(type: string): boolean {
  return type === "image/jpeg" || type === "image/webp"
}

function getPreferredOutputTypes(fileType: string): string[] {
  const normalized = fileType.toLowerCase()
  if (normalized === "image/png") {
    // PNG-аватары часто становятся слишком тяжелыми в base64.
    // Сначала пробуем WebP (лучшее качество при том же размере).
    return ["image/webp", "image/png", "image/jpeg"]
  }
  return ["image/webp", "image/jpeg"]
}

function resizeToBase64(file: File, maxPx = 2048): Promise<string> {
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

      const outputTypes = getPreferredOutputTypes(file.type)
      const sizeSteps = [maxPx, 1920, 1792, 1664, 1536, 1408, 1280, 1152, 1080, 1024, 960, 896, 840, 768]
      const qualitySteps = [0.98, 0.96, 0.94, 0.92, 0.9, 0.88, 0.86, 0.84, 0.82]
      let bestOutput = original

      for (const step of sizeSteps) {
        const scale = Math.min(step / width, step / height, 1)
        const nextWidth = Math.max(1, Math.round(width * scale))
        const nextHeight = Math.max(1, Math.round(height * scale))

        for (const type of outputTypes) {
          const qualities = isLossyImageType(type) ? qualitySteps : [undefined]
          for (const quality of qualities) {
            const output = renderResizedImageToDataUrl(
              img,
              nextWidth,
              nextHeight,
              type,
              quality,
            )

            bestOutput = output
            if (output.length <= MAX_AVATAR_DATA_URL_LENGTH) {
              resolve(output)
              return
            }
          }
        }
      }

      if (bestOutput.length <= MAX_AVATAR_DATA_URL_LENGTH) {
        resolve(bestOutput)
        return
      }

      // Не отправляем "огромный" data URL, который сервер/БД может не принять.
      throw new Error("avatar_too_large")
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
  const [recoveryStep, setRecoveryStep] = useState<"none" | "request" | "confirm">("none")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const isRecoveryMode = recoveryStep !== "none"

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
      setError("Фото слишком большое или не поддерживается. Попробуй JPG/PNG/WebP до 10 МБ")
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

  const resetRecoveryState = () => {
    setRecoveryStep("none")
    setResetCode("")
    setNewPassword("")
    setConfirmPassword("")
    setInfo("")
  }

  const openRecoveryFlow = () => {
    setIsRegister(false)
    setRecoveryStep("request")
    setPassword("")
    setError("")
    setInfo("")
    setResetCode("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleBack = () => {
    if (isRegister) {
      setIsRegister(false)
      setAvatarUrl("")
      setError("")
      setInfo("")
      return
    }

    if (recoveryStep === "confirm") {
      setRecoveryStep("request")
      setResetCode("")
      setNewPassword("")
      setConfirmPassword("")
      setError("")
      setInfo("")
      return
    }

    if (recoveryStep === "request") {
      resetRecoveryState()
      setError("")
    }
  }

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError("Введите email")
      return
    }

    if (!isRegister && recoveryStep === "request") {
      setIsLoading(true)
      setError("")
      setInfo("")

      try {
        await authAPI.requestPasswordReset(normalizedEmail)
        setRecoveryStep("confirm")
        setInfo("Код отправлен на почту. Введите его и придумайте новый пароль.")
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка"
        if (msg.includes("User not found")) {
          setError("Аккаунт с таким email не найден")
        } else if (msg.includes("Не удалось отправить код")) {
          setError(msg)
        } else {
          setError("Не удалось отправить код. Попробуйте позже.")
        }
      } finally {
        setIsLoading(false)
      }

      return
    }

    if (!isRegister && recoveryStep === "confirm") {
      const code = resetCode.trim()
      if (!/^\d{6}$/.test(code)) {
        setError("Введите 6-значный код из письма")
        return
      }
      if (newPassword.length < 6) {
        setError("Новый пароль должен быть минимум 6 символов")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("Пароли не совпадают")
        return
      }

      setIsLoading(true)
      setError("")
      setInfo("")

      try {
        await authAPI.resetPasswordWithCode(normalizedEmail, code, newPassword)
        await login(normalizedEmail, newPassword)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка"
        if (msg.includes("Неверный код") || msg.includes("истек")) {
          setError("Неверный код или срок его действия истек")
        } else {
          setError(msg)
        }
      } finally {
        setIsLoading(false)
      }

      return
    }

    if (!password.trim()) return

    setIsLoading(true)
    setError("")
    setInfo("")

    try {
      if (isRegister) {
        await register(normalizedEmail, password)
        trackRegistrationComplete()
        try {
          await profileAPI.updateAboutMe({
            onboardingStep: "about-step1",
            ...(avatarUrl ? { avatarUrl } : {}),
          })
        } catch (avatarError) {
          console.error("Failed to save onboarding progress during registration", avatarError)
        }
        // После регистрации идём заполнять профиль
        setScreen("about-step1")
      } else {
        await login(normalizedEmail, password)
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

  const title = isRegister
    ? "Регистрация"
    : recoveryStep === "request"
      ? "Восстановление пароля"
      : recoveryStep === "confirm"
        ? "Введите код"
        : "Вход"

  const subtitle = isRegister
    ? "Создайте аккаунт Study Buddy"
    : recoveryStep === "request"
      ? "Отправим код подтверждения на вашу почту"
      : recoveryStep === "confirm"
        ? "Введите код из письма и задайте новый пароль"
        : "Войдите в свой аккаунт"

  const primaryButtonLabel = isLoading
    ? "Загрузка..."
    : isRegister
      ? "Зарегистрироваться"
      : recoveryStep === "request"
        ? "Отправить код"
        : recoveryStep === "confirm"
          ? "Сохранить новый пароль"
          : "Войти"

  const isPrimaryDisabled = isLoading || !email.trim() || (
    !isRegister && recoveryStep === "confirm"
      ? !resetCode.trim() || !newPassword || !confirmPassword
      : !isRecoveryMode && !password.trim()
  )

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      <div className="flex items-center h-14 mt-2">
        {(isRegister || isRecoveryMode) && (
          <button onClick={handleBack} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-center mb-2">{title}</h1>
        <p className="text-sm text-gray-400 text-center mb-8">{subtitle}</p>

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

          {!isRecoveryMode && (
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
          )}

          {recoveryStep === "confirm" && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Код из письма</label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 цифр"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-colors bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-colors bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Повторите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-colors bg-transparent"
                />
              </div>
            </>
          )}

          {isRegister && !isRecoveryMode && (
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

        {info && (
          <p className="text-green-600 text-sm text-center mt-4 animate-fade-in">{info}</p>
        )}

        <div className="mt-auto pb-8 space-y-3">
          <button
            className="btn-green"
            onClick={handleSubmit}
            disabled={isPrimaryDisabled}
          >
            {primaryButtonLabel}
          </button>

          {!isRecoveryMode && !isRegister && (
            <button
              className="w-full text-sm text-gray-500 underline text-center"
              onClick={openRecoveryFlow}
            >
              Забыли пароль?
            </button>
          )}

          {!isRecoveryMode && (
            <button
              className="w-full text-sm text-gray-500 underline text-center"
              onClick={() => {
                setIsRegister(!isRegister)
                resetRecoveryState()
                setAvatarUrl("")
                setError("")
                setInfo("")
              }}
            >
              {isRegister
                ? "Уже есть аккаунт? Войти"
                : "Нет аккаунта? Зарегистрироваться"}
            </button>
          )}

          {isRecoveryMode && (
            <button
              className="w-full text-sm text-gray-500 underline text-center"
              onClick={() => {
                resetRecoveryState()
                setError("")
              }}
            >
              Вернуться ко входу
            </button>
          )}

          {recoveryStep === "confirm" && (
            <button
              className="w-full text-sm text-gray-500 underline text-center"
              onClick={() => {
                setRecoveryStep("request")
                setInfo("")
                setError("")
              }}
            >
              Отправить код заново
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
