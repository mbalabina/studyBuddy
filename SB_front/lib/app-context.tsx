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
  | "profile"
  | "search-intro"
  | "search-card"
  | "search-profile"
  | "match-waiting"
  | "match-success"
  | "match-contacts"
  | "likes"
  | "likes-candidates"
  | "admirers"
  | "admirers-candidates"


export interface UserProfile {
  firstName: string
  lastName: string
  age: number | null
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
  avatarUrl: string
  learningFormat: string
  communicationStyle: string
  bio: string
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
  age: number | null
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
  favoriteCandidates: Candidate[]
  admirerCandidates: Candidate[]
  isLoadingCandidates: boolean
  isLoggedIn: boolean
  authUserId: number | null
  authEmail: string | null
  apiError: string | null
  currentAdmirerIndex: number
  currentFavoriteIndex: number
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
  loadCandidates: (goalOverride?: string) => Promise<void>
  loadFavoriteCandidates: () => Promise<void>
  loadAdmirerCandidates: () => Promise<void>
  loadProfile: () => Promise<void>
  saveProfile: (overrides?: Partial<UserProfile>) => Promise<void>
  savePreferences: (overrides?: Partial<UserProfile>) => Promise<void>
}


const defaultUser: UserProfile = {
  firstName: "",
  lastName: "",
  age: null,
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
  avatarUrl: "",
  learningFormat: "",
  communicationStyle: "",
  bio: "",
}


const AppContext = createContext<AppContextType | null>(null)

function normalizeGoalValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function createAccountScopedDefaults() {
  return {
    user: defaultUser,
    currentGoalIndex: 0,
    currentCandidateIndex: 0,
    likedCandidates: [],
    matchedCandidate: null,
    candidates: [],
    favoriteCandidates: [],
    admirerCandidates: [],
    isLoadingCandidates: false,
    apiError: null,
    currentAdmirerIndex: 0,
    currentFavoriteIndex: 0,
  }
}


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
    favoriteCandidates: [],
    admirerCandidates: [],
    isLoadingCandidates: false,
    isLoggedIn: false,
    authUserId: null,
    authEmail: null,
    apiError: null,
    currentAdmirerIndex: 0,
    currentFavoriteIndex: 0,
  })


  const stateRef = useRef(state)
  stateRef.current = state

  const sessionVersionRef = useRef(0)

  const beginSessionTransition = useCallback(() => {
    sessionVersionRef.current += 1
    return sessionVersionRef.current
  }, [])

  const isSessionCurrent = useCallback((sessionVersion: number) => {
    return sessionVersion === sessionVersionRef.current
  }, [])

  const setStateForSession = useCallback(
    (sessionVersion: number, updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        if (!isSessionCurrent(sessionVersion)) {
          return prev
        }

        return updater(prev)
      })
    },
    [isSessionCurrent],
  )


  // ========== ЗАГРУЗКА КАНДИДАТОВ ==========
  const loadCandidatesForSession = useCallback(async (sessionVersion: number, goalOverride?: string) => {
    setStateForSession(sessionVersion, (prev) => ({
      ...prev,
      isLoadingCandidates: true,
      apiError: null,
    }))

    try {
      const selectedGoal = goalOverride?.trim() || stateRef.current.user.studyGoals[stateRef.current.currentGoalIndex]?.name?.trim()
      const data = await matchingAPI.getCandidates({ limit: 50, offset: 0, goal: selectedGoal || undefined })
      const rawList: Candidate[] = Array.isArray(data) ? data : (data as { items?: Candidate[] })?.items ?? []
      const normalizedSelectedGoal = normalizeGoalValue(selectedGoal)
      const list = normalizedSelectedGoal
        ? rawList.filter((candidate) => normalizeGoalValue(candidate.goal) === normalizedSelectedGoal)
        : []

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        candidates: list,
        currentCandidateIndex: 0,
        isLoadingCandidates: false,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки кандидатов"

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        candidates: [],
        currentCandidateIndex: 0,
        isLoadingCandidates: false,
        apiError: msg,
      }))
    }
  }, [setStateForSession])

  const loadCandidates = useCallback((goalOverride?: string) => {
    return loadCandidatesForSession(sessionVersionRef.current, goalOverride)
  }, [loadCandidatesForSession])

  const loadFavoriteCandidatesForSession = useCallback(async (sessionVersion: number) => {
    try {
      const data = await favoritesAPI.getMyFavorites()
      const list: Candidate[] = Array.isArray(data) ? data : []

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        favoriteCandidates: list,
        currentFavoriteIndex: 0,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки моих лайков"

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        favoriteCandidates: [],
        currentFavoriteIndex: 0,
        apiError: msg,
      }))
    }
  }, [setStateForSession])

  const loadFavoriteCandidates = useCallback(() => {
    return loadFavoriteCandidatesForSession(sessionVersionRef.current)
  }, [loadFavoriteCandidatesForSession])

  const loadAdmirerCandidatesForSession = useCallback(async (sessionVersion: number) => {
    try {
      const data = await favoritesAPI.getAdmirers()
      const list: Candidate[] = Array.isArray(data) ? data : []

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        admirerCandidates: list,
        currentAdmirerIndex: 0,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки тех, кто лайкнул тебя"

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        admirerCandidates: [],
        currentAdmirerIndex: 0,
        apiError: msg,
      }))
    }
  }, [setStateForSession])

  const loadAdmirerCandidates = useCallback(() => {
    return loadAdmirerCandidatesForSession(sessionVersionRef.current)
  }, [loadAdmirerCandidatesForSession])


  // ========== ЗАГРУЗКА ПРОФИЛЯ ==========
  const loadProfileForSession = useCallback(async (sessionVersion: number) => {
    try {
      const data = await profileAPI.getMe() as any
      const profile = data?.profile
      const preferences = data?.preferences
      const safeUser = data?.user

      const goals: StudyGoal[] = profile?.studyGoal
        ? [{ id: "1", name: profile.studyGoal, description: profile.bio || "", startDate: "" }]
        : []


      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        user: {
          ...defaultUser,
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          age: typeof profile?.age === "number" ? profile.age : null,
          city: profile?.city || "",
          role: profile?.course?.includes("класс") ? "pupil" : "student",
          university: profile?.university || "",
          program: profile?.program || "",
          course: profile?.course || defaultUser.course,
          messengerHandle: profile?.messengerHandle || safeUser?.telegramUsername || "",
          knowledgeLevel: profile?.proficiencyLevel || "",
          preferredTime: Array.isArray(profile?.schedule) ? profile.schedule : [],
          studyGoals: goals,
          bio: profile?.bio || "",
          avatarUrl: profile?.avatarUrl || "",
          learningFormat: profile?.learningFormat || preferences?.learningFormat || "",
          communicationStyle: profile?.communicationStyle || preferences?.communicationStyle || "",
          partnerLevel: preferences?.preferredLevel || "",
        },
      }))
    } catch (e) {
      console.error("Failed to load profile", e)

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        user: defaultUser,
      }))
    }
  }, [setStateForSession])

  const loadProfile = useCallback(() => {
    return loadProfileForSession(sessionVersionRef.current)
  }, [loadProfileForSession])


  // При старте — проверяем сессию
  useEffect(() => {
    const checkSession = async () => {
      const sessionVersion = beginSessionTransition()

      try {
        const me = await authAPI.getMe()
        if (!isSessionCurrent(sessionVersion)) {
          return
        }

        if (me && (me as { id?: number }).id) {
          const user = me as { id: number; email: string }

          setStateForSession(sessionVersion, (prev) => ({
            ...prev,
            ...createAccountScopedDefaults(),
            isLoggedIn: true,
            authUserId: user.id,
            authEmail: user.email,
            screen: "main",
          }))

          await Promise.all([
            loadCandidatesForSession(sessionVersion),
            loadFavoriteCandidatesForSession(sessionVersion),
            loadAdmirerCandidatesForSession(sessionVersion),
            loadProfileForSession(sessionVersion),
          ])
        } else {
          setStateForSession(sessionVersion, (prev) => ({
            ...prev,
            ...createAccountScopedDefaults(),
            isLoggedIn: false,
            authUserId: null,
            authEmail: null,
            screen: "auth",
          }))
        }
      } catch {
        if (!isSessionCurrent(sessionVersion)) {
          return
        }

        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          ...createAccountScopedDefaults(),
          isLoggedIn: false,
          authUserId: null,
          authEmail: null,
          screen: "auth",
        }))
      }
    }


    const timer = setTimeout(checkSession, 1500)
    return () => clearTimeout(timer)
  }, [
    beginSessionTransition,
    isSessionCurrent,
    loadAdmirerCandidatesForSession,
    loadCandidatesForSession,
    loadFavoriteCandidatesForSession,
    loadProfileForSession,
    setStateForSession,
  ])


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


    setState((prev) => ({
      ...prev,
      likedCandidates: [...prev.likedCandidates, candidate.id],
      currentCandidateIndex: prev.currentCandidateIndex + 1,
    }))


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
    const sessionVersion = beginSessionTransition()
    const result = await authAPI.login(email, password) as { user?: { id: number; email: string }; token?: string }
    if (!isSessionCurrent(sessionVersion)) {
      return
    }

    const user = result?.user ?? (result as { id?: number; email?: string })
    setStateForSession(sessionVersion, (prev) => ({
      ...prev,
      ...createAccountScopedDefaults(),
      isLoggedIn: true,
      authUserId: (user as { id?: number })?.id ?? null,
      authEmail: (user as { email?: string })?.email ?? email,
      apiError: null,
      screen: "main",
    }))

    await Promise.all([
      loadCandidatesForSession(sessionVersion),
      loadFavoriteCandidatesForSession(sessionVersion),
      loadAdmirerCandidatesForSession(sessionVersion),
      loadProfileForSession(sessionVersion),
    ])
  }, [
    beginSessionTransition,
    isSessionCurrent,
    loadAdmirerCandidatesForSession,
    loadCandidatesForSession,
    loadFavoriteCandidatesForSession,
    loadProfileForSession,
    setStateForSession,
  ])


  const register = useCallback(async (email: string, password: string, telegram?: string) => {
    const sessionVersion = beginSessionTransition()
    const result = await authAPI.register(email, password, telegram) as { user?: { id: number; email: string }; token?: string }
    if (!isSessionCurrent(sessionVersion)) {
      return
    }

    const user = result?.user ?? (result as { id?: number; email?: string })
    setStateForSession(sessionVersion, (prev) => ({
      ...prev,
      ...createAccountScopedDefaults(),
      isLoggedIn: true,
      authUserId: (user as { id?: number })?.id ?? null,
      authEmail: (user as { email?: string })?.email ?? email,
      apiError: null,
    }))
  }, [beginSessionTransition, isSessionCurrent, setStateForSession])


  const logout = useCallback(async () => {
    const sessionVersion = beginSessionTransition()

    try {
      await authAPI.logout()
    } catch {
      // не страшно
    }

    if (!isSessionCurrent(sessionVersion)) {
      return
    }

    setStateForSession(sessionVersion, (prev) => ({
      ...prev,
      ...createAccountScopedDefaults(),
      isLoggedIn: false,
      authUserId: null,
      authEmail: null,
      screen: "auth",
    }))
  }, [beginSessionTransition, isSessionCurrent, setStateForSession])


  // ========== СОХРАНЕНИЕ ПРОФИЛЯ ==========
  const saveProfile = useCallback(async (overrides?: Partial<UserProfile>) => {
    const u = { ...stateRef.current.user, ...overrides }
    const primaryGoal = u.studyGoals[0]
    await profileAPI.updateAboutMe({
      firstName: u.firstName,
      lastName: u.lastName,
      age: u.age ?? undefined,
      city: u.city,
      university: u.university,
      program: u.program,
      course: u.course,
      messengerHandle: u.messengerHandle,
      studyGoal: primaryGoal?.name ?? "",
      proficiencyLevel: u.knowledgeLevel,
      schedule: u.preferredTime,
      learningFormat: u.learningFormat,
      communicationStyle: u.communicationStyle,
      bio: primaryGoal?.description || u.bio,
      avatarUrl: u.avatarUrl,
    })
  }, [])


  const savePreferences = useCallback(async (overrides?: Partial<UserProfile>) => {
    const u = { ...stateRef.current.user, ...overrides }
    await profileAPI.updatePartnerPreferences({
      preferredLevel: u.partnerLevel,
      preferredSchedule: u.preferredTime,
      city: u.city,
      learningFormat: u.learningFormat,
      communicationStyle: u.communicationStyle,
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
        loadFavoriteCandidates,
        loadAdmirerCandidates,
        loadProfile,
        saveProfile,
        savePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
