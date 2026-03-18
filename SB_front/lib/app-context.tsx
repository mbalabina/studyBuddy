"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { authAPI, matchingAPI, favoritesAPI, profileAPI } from "./api"

// ========== TYPES ==========
export type AppScreen =
  | "splash"
  | "auth"
  | "auth-code"
  | "about-step1"
  | "about-step2"
  | "about-step3"
  | "about-congrats"
  | "about-goal"
  | "new-goal"        
  | "about-congrats2"
  | "survey1"
  | "survey2"
  | "main"
  | "search-intro"
  | "search-card"
  | "search-profile"
  | "match-waiting"
  | "match-success"
  | "match-contacts"
  | "likes"
  | "likes-candidates"


export interface UserProfile {
  firstName: string
  lastName: string
  city: string
  role: "student" | "pupil"
  university: string
  program: string
  course: string
  messenger: "telegram" | "vk"
  messengerHandle: string
  studyGoals: StudyGoal[]
  preferredTime: string[]
  motivation: string[]
  knowledgeLevel: string
  learningStyle: string[]
  organization: number
  sociability: number
  friendliness: number
  stressResistance: number
  importantInStudy: string[]
  additionalGoals: string[]
  partnerLevel: string
  importantTraits: string[]
  partnerLearningStyle: string[]
}

export interface StudyGoal {
  id: string
  name: string
  description: string
  startDate: string
}

export interface Candidate {
  id: number
  name: string
  age: number
  city: string
  avatar: string
  compatibility: number
  university: string
  course: string
  goal: string
  goalDescription: string
  telegram: string
  isFavorite?: boolean
}

interface AppState {
  screen: AppScreen
  user: UserProfile
  currentGoalIndex: number
  currentCandidateIndex: number
  likedCandidates: number[]
  matchedCandidate: Candidate | null
  candidates: Candidate[]
  isLoadingCandidates: boolean
  isLoggedIn: boolean
  authUserId: number | null
  authEmail: string | null
  apiError: string | null
}

interface AppContextType {
  state: AppState
  setScreen: (screen: AppScreen) => void
  updateUser: (updates: Partial<UserProfile>) => void
  addStudyGoal: (goal: StudyGoal) => void
  likeCurrent: () => void
  rejectCurrent: () => void
  nextCandidate: () => void
  setState: React.Dispatch<React.SetStateAction<AppState>>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, telegram?: string) => Promise<void>
  logout: () => Promise<void>
  loadCandidates: () => Promise<void>
  saveProfile: () => Promise<void>
  savePreferences: () => Promise<void>
}

const defaultUser: UserProfile = {
  firstName: "",
  lastName: "",
  city: "",
  role: "student",
  university: "",
  program: "",
  course: "1 курс",
  messenger: "telegram",
  messengerHandle: "",
  studyGoals: [],
  preferredTime: [],
  motivation: [],
  knowledgeLevel: "",
  learningStyle: [],
  organization: 0,
  sociability: 0,
  friendliness: 0,
  stressResistance: 0,
  importantInStudy: [],
  additionalGoals: [],
  partnerLevel: "",
  importantTraits: [],
  partnerLearningStyle: [],
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be inside AppProvider")
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    screen: "splash",
    user: defaultUser,
    currentGoalIndex: 0,
    currentCandidateIndex: 0,
    likedCandidates: [],
    matchedCandidate: null,
    candidates: [],
    isLoadingCandidates: false,
    isLoggedIn: false,
    authUserId: null,
    authEmail: null,
    apiError: null,
  })

  // Используем ref чтобы иметь доступ к актуальному state внутри колбэков
  const stateRef = useRef(state)
  stateRef.current = state

  // ========== ЗАГРУЗКА КАНДИДАТОВ ==========
  const loadCandidates = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingCandidates: true, apiError: null }))
    try {
      const data = await matchingAPI.getCandidates({ limit: 50, offset: 0 })
      const list: Candidate[] = Array.isArray(data) ? data : (data as { items?: Candidate[] })?.items ?? []
      setState((prev) => ({
        ...prev,
        candidates: list,
        currentCandidateIndex: 0,
        isLoadingCandidates: false,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки кандидатов"
      setState((prev) => ({ ...prev, isLoadingCandidates: false, apiError: msg }))
    }
  }, [])

  // При старте — проверяем сессию
  useEffect(() => {
    const checkSession = async () => {
      try {
        const me = await authAPI.getMe()
        if (me && (me as { id?: number }).id) {
          const user = me as { id: number; email: string }
          setState((prev) => ({
            ...prev,
            isLoggedIn: true,
            authUserId: user.id,
            authEmail: user.email,
            screen: "main",
          }))
          await loadCandidates()
        } else {
          setState((prev) => ({ ...prev, screen: "auth" }))
        }
      } catch {
        setState((prev) => ({ ...prev, screen: "auth" }))
      }
    }

    const timer = setTimeout(checkSession, 1500)
    return () => clearTimeout(timer)
  }, [loadCandidates])

  // ========== БАЗОВЫЕ ФУНКЦИИ ==========
  const setScreen = useCallback((screen: AppScreen) => {
    setState((prev) => ({ ...prev, screen }))
  }, [])

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, ...updates } }))
  }, [])

  const addStudyGoal = useCallback((goal: StudyGoal) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, studyGoals: [...prev.user.studyGoals, goal] },
    }))
  }, [])

  const likeCurrent = useCallback(() => {
    const current = stateRef.current
    const candidate = current.candidates[current.currentCandidateIndex]
    if (!candidate) return

    // Сначала обновляем UI
    setState((prev) => ({
      ...prev,
      likedCandidates: [...prev.likedCandidates, candidate.id],
      currentCandidateIndex: prev.currentCandidateIndex + 1,
    }))

    // Потом отправляем в бэк
    favoritesAPI.like(candidate.id).catch(console.error)
  }, [])

  const rejectCurrent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCandidateIndex: prev.currentCandidateIndex + 1,
    }))
  }, [])

  const nextCandidate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCandidateIndex: prev.currentCandidateIndex + 1,
    }))
  }, [])

  // ========== AUTH ==========
  const login = useCallback(async (email: string, password: string) => {
    const result = await authAPI.login(email, password) as { user?: { id: number; email: string } }
    const user = result?.user ?? (result as { id?: number; email?: string })
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      authUserId: (user as { id?: number })?.id ?? null,
      authEmail: (user as { email?: string })?.email ?? email,
      apiError: null,
    }))
    await loadCandidates()
  }, [loadCandidates])

  const register = useCallback(async (email: string, password: string, telegram?: string) => {
    const result = await authAPI.register(email, password, telegram) as { user?: { id: number; email: string } }
    const user = result?.user ?? (result as { id?: number; email?: string })
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      authUserId: (user as { id?: number })?.id ?? null,
      authEmail: (user as { email?: string })?.email ?? email,
      apiError: null,
    }))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // не страшно
    }
    setState((prev) => ({
      ...prev,
      isLoggedIn: false,
      authUserId: null,
      authEmail: null,
      candidates: [],
      screen: "auth",
      user: defaultUser,
    }))
  }, [])

  // ========== СОХРАНЕНИЕ ПРОФИЛЯ ==========
  const saveProfile = useCallback(async () => {
    const u = stateRef.current.user
    await profileAPI.updateAboutMe({
      firstName: u.firstName,
      lastName: u.lastName,
      city: u.city,
      studyGoal: u.studyGoals[0]?.name ?? "",
      proficiencyLevel: u.knowledgeLevel,
      schedule: u.preferredTime,
    })
  }, [])

  const savePreferences = useCallback(async () => {
    const u = stateRef.current.user
    await profileAPI.updatePartnerPreferences({
      preferredLevel: u.partnerLevel,
      preferredSchedule: u.preferredTime,
      city: u.city,
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        setScreen,
        updateUser,
        addStudyGoal,
        likeCurrent,
        rejectCurrent,
        nextCandidate,
        setState,
        login,
        register,
        logout,
        loadCandidates,
        saveProfile,
        savePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
