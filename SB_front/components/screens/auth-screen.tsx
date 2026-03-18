"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { ChevronLeft } from "lucide-react"

export default function AuthScreen() {
  const { login, register, setScreen } = useApp()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [telegram, setTelegram] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return
    setIsLoading(true)
    setError("")

    try {
      if (isRegister) {
        await register(email.trim(), password, telegram.trim() || undefined)
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
          <button onClick={() => { setIsRegister(false); setError("") }} className="p-1">
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
              <label className="text-sm font-medium mb-1 block">
                Telegram <span className="text-gray-400 font-normal">(необязательно)</span>
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-colors bg-transparent"
              />
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
            onClick={() => { setIsRegister(!isRegister); setError("") }}
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
