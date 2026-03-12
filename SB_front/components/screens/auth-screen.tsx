"use client"

import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/lib/app-context"
import { ChevronLeft } from "lucide-react"

export default function AuthScreen() {
  const { state, setScreen } = useApp()
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")
  const [email, setEmail] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [mockCode, setMockCode] = useState("")

  const isAuthCode = state.screen === "auth-code"

  const handleSendCode = () => {
    const generated = String(Math.floor(1000 + Math.random() * 9000))
    setMockCode(generated)
    setCodeSent(true)
    setScreen("auth-code")
  }

  const handleBackToInput = () => {
    setCodeSent(false)
    setMockCode("")
    setScreen("auth")
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center h-14 mt-2">
        {isAuthCode && (
          <button onClick={handleBackToInput} className="p-1" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-center mb-8">Авторизация</h1>

        {/* Toggle */}
        <div className="toggle-pill mx-auto mb-10 w-full max-w-[280px]">
          <button
            className={authMethod === "email" ? "active" : ""}
            onClick={() => { setAuthMethod("email"); if (!isAuthCode) setEmail("") }}
          >
            Email
          </button>
          <button
            className={authMethod === "phone" ? "active" : ""}
            onClick={() => { setAuthMethod("phone"); if (!isAuthCode) setEmail("") }}
          >
            Телефон
          </button>
        </div>

        {!isAuthCode ? (
          <div className="flex-1 flex flex-col">
            <label className="text-base font-semibold text-center mb-3">
              {authMethod === "email" ? "Email" : "Телефон"}
            </label>
            <input
              type={authMethod === "email" ? "email" : "tel"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={authMethod === "email" ? "name@edu.hse.com" : "+7 (999) 123-45-67"}
              className="text-center text-lg py-3 border-b-2 border-gray-200 focus:border-black outline-none transition-colors bg-transparent"
            />

            <div className="mt-auto pb-8">
              <button
                className="btn-green"
                onClick={handleSendCode}
                disabled={!email.trim()}
              >
                Получить код
              </button>
            </div>
          </div>
        ) : (
          <AuthCodeView
            onVerify={() => setScreen("about-step1")}
            onBack={handleBackToInput}
            authMethod={authMethod}
            contactValue={email}
            mockCode={mockCode}
            onResend={handleSendCode}
          />
        )}
      </div>
    </div>
  )
}

function AuthCodeView({
  onVerify,
  onBack,
  authMethod,
  contactValue,
  mockCode,
  onResend,
}: {
  onVerify: () => void
  onBack: () => void
  authMethod: string
  contactValue: string
  mockCode: string
  onResend: () => void
}) {
  const [code, setCode] = useState(["", "", "", ""])
  const [timer, setTimer] = useState(59)
  const [error, setError] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timer])

  const verifyCode = useCallback(
    (digits: string[]) => {
      const entered = digits.join("")
      if (entered === mockCode) {
        setError(false)
        setTimeout(onVerify, 300)
      } else {
        setError(true)
        setTimeout(() => {
          setCode(["", "", "", ""])
          setError(false)
          const first = document.getElementById("code-0")
          first?.focus()
        }, 800)
      }
    },
    [mockCode, onVerify]
  )

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError(false)

    if (value && index < 3) {
      const next = document.getElementById(`code-${index + 1}`)
      next?.focus()
    }

    if (newCode.every((d) => d !== "")) {
      verifyCode(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`)
      prev?.focus()
    }
  }

  const handleResend = () => {
    setCode(["", "", "", ""])
    setTimer(59)
    setError(false)
    setShowBanner(true)
    onResend()
  }

  return (
    <div className="flex-1 flex flex-col animate-slide-in-right">
      {/* Mock code banner */}
      {showBanner && (
        <div className="mx-auto mb-4 px-4 py-2.5 rounded-xl bg-[var(--green-light)] border border-[var(--green-accent)] text-sm text-center max-w-[300px]">
          <p className="text-gray-500 text-xs mb-0.5">
            {authMethod === "email"
              ? `Код отправлен на ${contactValue}`
              : `SMS отправлено на ${contactValue}`}
          </p>
          <p className="font-bold text-lg tracking-[0.3em]">{mockCode}</p>
          <button
            onClick={() => setShowBanner(false)}
            className="text-xs text-gray-400 mt-1 underline"
          >
            Скрыть
          </button>
        </div>
      )}

      <label className="text-base font-semibold text-center mb-6">Код</label>
      <div className="flex justify-center gap-3 mb-4">
        {code.map((digit, i) => (
          <input
            key={i}
            id={`code-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-14 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors bg-gray-50 ${
              error
                ? "border-red-400 animate-shake"
                : "border-gray-200 focus:border-black"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-red-500 text-sm mb-4 animate-fade-in">
          Неверный код, попробуйте снова
        </p>
      )}

      <div className="mt-auto pb-8 space-y-3 text-center">
        <button
          className="btn-outline-gray w-full"
          disabled={timer > 0}
          onClick={handleResend}
        >
          {timer > 0
            ? `Отправить снова (00:${timer.toString().padStart(2, "0")})`
            : "Отправить снова"}
        </button>
        <button className="text-sm text-gray-400 underline" onClick={onBack}>
          {authMethod === "email"
            ? "Вернуться к вводу почты"
            : "Вернуться к вводу номера"}
        </button>
      </div>
    </div>
  )
}
