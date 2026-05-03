"use client"


import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { authAPI, matchingAPI, favoritesAPI, profileAPI, goalsAPI } from "./api"
import { trackSessionReturn } from "./yandex-metrika"


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
  id: number
  name: string
  description: string
  language?: string
  startDate: string
  isActive?: boolean
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
  goalLanguage?: string
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
  selectedCandidate: Candidate | null
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
  candidatesByGoal: Record<number, Candidate[]>
  favoriteCandidatesByGoal: Record<number, Candidate[]>
  admirerCandidatesByGoal: Record<number, Candidate[]>
  currentCandidateIndexByGoal: Record<number, number>
  currentFavoriteIndexByGoal: Record<number, number>
  currentAdmirerIndexByGoal: Record<number, number>
  profileSourceScreen: AppScreen
}


interface AppContextType {
  state: AppState
  setScreen: (screen: AppScreen) => void
  updateUser: (updates: Partial<UserProfile>) => void
  addStudyGoal: (goal: Omit<StudyGoal, "id">) => Promise<void>
  setActiveGoal: (goalId: number) => Promise<void>
  updateStudyGoal: (goalId: number, goal: Omit<StudyGoal, "id">) => Promise<void>
  completeStudyGoal: (goalId: number) => Promise<void>
  likeCurrent: () => Promise<{ matched: boolean; candidate: Candidate } | null>
  rejectCurrent: () => void
  nextCandidate: () => void
  setState: React.Dispatch<React.SetStateAction<AppState>>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, telegramUsername?: string) => Promise<void>
  logout: () => Promise<void>
  loadCandidates: (goalIdOverride?: number) => Promise<void>
  loadFavoriteCandidates: (options?: { allGoals?: boolean }) => Promise<void>
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

function normalizeLanguageValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function isLanguageStudyGoalName(goalName: string | null | undefined) {
  return normalizeGoalValue(goalName) === "изучение языка"
}

function isNotFoundApiError(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.message.toLowerCase().includes("api error: 404")
}

function resolveGoalSelection(state: AppState, goalIdOverride?: number) {
  const goals = state.user.studyGoals
  if (goals.length === 0) {
    return { goal: null as StudyGoal | null, goalIndex: 0 }
  }

  if (typeof goalIdOverride === "number") {
    const indexById = goals.findIndex((goal) => goal.id === goalIdOverride)
    if (indexById >= 0) {
      return { goal: goals[indexById], goalIndex: indexById }
    }
  }

  const safeIndex = Math.min(Math.max(state.currentGoalIndex, 0), goals.length - 1)
  return { goal: goals[safeIndex], goalIndex: safeIndex }
}

function createAccountScopedDefaults() {
  return {
    user: defaultUser,
    currentGoalIndex: 0,
    currentCandidateIndex: 0,
    likedCandidates: [],
    matchedCandidate: null,
    selectedCandidate: null,
    candidates: [],
    favoriteCandidates: [],
    admirerCandidates: [],
    isLoadingCandidates: false,
    apiError: null,
    currentAdmirerIndex: 0,
    currentFavoriteIndex: 0,
    candidatesByGoal: {},
    favoriteCandidatesByGoal: {},
    admirerCandidatesByGoal: {},
    currentCandidateIndexByGoal: {},
    currentFavoriteIndexByGoal: {},
    currentAdmirerIndexByGoal: {},
    profileSourceScreen: "search-card",
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
    selectedCandidate: null,
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
    candidatesByGoal: {},
    favoriteCandidatesByGoal: {},
    admirerCandidatesByGoal: {},
    currentCandidateIndexByGoal: {},
    currentFavoriteIndexByGoal: {},
    currentAdmirerIndexByGoal: {},
    profileSourceScreen: "search-card",
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
  const loadCandidatesForSession = useCallback(async (sessionVersion: number, goalIdOverride?: number) => {
    const { goal, goalIndex } = resolveGoalSelection(stateRef.current, goalIdOverride)
    const selectedGoalId = goal?.id
    const selectedGoalName = goal?.name?.trim() || ""
    const selectedGoalLanguage = goal?.language?.trim() || ""

    setStateForSession(sessionVersion, (prev) => ({
      ...prev,
      isLoadingCandidates: true,
      apiError: null,
      currentGoalIndex: goalIndex,
    }))

    try {
      const data = await matchingAPI.getCandidates({
        limit: 50,
        offset: 0,
        goalId: selectedGoalId,
        goal: selectedGoalName || undefined,
      })
      const rawList: Candidate[] = Array.isArray(data) ? data : (data as { items?: Candidate[] })?.items ?? []
      const normalizedSelectedGoal = normalizeGoalValue(selectedGoalName)
      const normalizedSelectedLanguage = normalizeLanguageValue(selectedGoalLanguage)
      const list = normalizedSelectedGoal
        ? rawList.filter((candidate) => {
            if (normalizeGoalValue(candidate.goal) !== normalizedSelectedGoal) {
              return false
            }

            if (isLanguageStudyGoalName(selectedGoalName) && normalizedSelectedLanguage) {
              return normalizeLanguageValue(candidate.goalLanguage) === normalizedSelectedLanguage
            }

            return true
          })
        : []

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        candidates: list,
        currentCandidateIndex:
          typeof selectedGoalId === "number"
            ? (prev.currentCandidateIndexByGoal[selectedGoalId] ?? 0)
            : 0,
        isLoadingCandidates: false,
        candidatesByGoal:
          typeof selectedGoalId === "number"
            ? { ...prev.candidatesByGoal, [selectedGoalId]: list }
            : prev.candidatesByGoal,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки кандидатов"

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        candidates: [],
        currentCandidateIndex: 0,
        isLoadingCandidates: false,
        apiError: msg,
        candidatesByGoal:
          typeof selectedGoalId === "number"
            ? { ...prev.candidatesByGoal, [selectedGoalId]: [] }
            : prev.candidatesByGoal,
      }))
    }
  }, [setStateForSession])

  const loadCandidates = useCallback((goalIdOverride?: number) => {
    return loadCandidatesForSession(sessionVersionRef.current, goalIdOverride)
  }, [loadCandidatesForSession])

  const loadFavoriteCandidatesForSession = useCallback(async (sessionVersion: number, goalIdOverride?: number) => {
    const { goal, goalIndex } = resolveGoalSelection(stateRef.current, goalIdOverride)
    const selectedGoalId = goal?.id
    try {
      const data = await favoritesAPI.getMyFavorites(selectedGoalId)
      const list: Candidate[] = Array.isArray(data) ? data : []

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        currentGoalIndex: goalIndex,
        favoriteCandidates: list,
        currentFavoriteIndex:
          typeof selectedGoalId === "number"
            ? (prev.currentFavoriteIndexByGoal[selectedGoalId] ?? 0)
            : 0,
        favoriteCandidatesByGoal:
          typeof selectedGoalId === "number"
            ? { ...prev.favoriteCandidatesByGoal, [selectedGoalId]: list }
            : prev.favoriteCandidatesByGoal,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки моих лайков"

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        favoriteCandidates: [],
        currentFavoriteIndex: 0,
        apiError: msg,
        favoriteCandidatesByGoal:
          typeof selectedGoalId === "number"
            ? { ...prev.favoriteCandidatesByGoal, [selectedGoalId]: [] }
            : prev.favoriteCandidatesByGoal,
      }))
    }
  }, [setStateForSession])

  const loadAllFavoriteCandidatesForSession = useCallback(async (sessionVersion: number) => {
    const goals = stateRef.current.user.studyGoals.filter((goal) => typeof goal.id === "number")

    try {
      const scopedLists = goals.length > 0
        ? await Promise.all(
            goals.map(async (goal) => {
              const data = await favoritesAPI.getMyFavorites(goal.id)
              const list: Candidate[] = Array.isArray(data) ? data : []
              return { goalId: goal.id, list }
            }),
          )
        : []

      const fallbackData = goals.length === 0 ? await favoritesAPI.getMyFavorites() : []
      const fallbackList: Candidate[] = Array.isArray(fallbackData) ? fallbackData : []

      const merged = goals.length > 0
        ? scopedLists.flatMap((item) => item.list)
        : fallbackList

      const seen = new Set<string>()
      const deduplicated: Candidate[] = []
      for (const candidate of merged) {
        const key = `${candidate.id}:${normalizeGoalValue(candidate.goal)}`
        if (seen.has(key)) continue
        seen.add(key)
        deduplicated.push(candidate)
      }

      setStateForSession(sessionVersion, (prev) => {
        const nextByGoal = { ...prev.favoriteCandidatesByGoal }
        for (const item of scopedLists) {
          nextByGoal[item.goalId] = item.list
        }

        return {
          ...prev,
          favoriteCandidates: deduplicated,
          currentFavoriteIndex:
            deduplicated.length === 0
              ? 0
              : Math.min(prev.currentFavoriteIndex, deduplicated.length - 1),
          favoriteCandidatesByGoal: nextByGoal,
        }
      })
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

  const loadFavoriteCandidates = useCallback((options?: { allGoals?: boolean }) => {
    if (options?.allGoals) {
      return loadAllFavoriteCandidatesForSession(sessionVersionRef.current)
    }

    return loadFavoriteCandidatesForSession(sessionVersionRef.current)
  }, [loadAllFavoriteCandidatesForSession, loadFavoriteCandidatesForSession])

  const loadAdmirerCandidatesForSession = useCallback(async (sessionVersion: number, goalIdOverride?: number) => {
    const { goal, goalIndex } = resolveGoalSelection(stateRef.current, goalIdOverride)
    const selectedGoalId = goal?.id
    try {
      const data = await favoritesAPI.getAdmirers(selectedGoalId)
      const list: Candidate[] = Array.isArray(data) ? data : []

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        currentGoalIndex: goalIndex,
        admirerCandidates: list,
        currentAdmirerIndex:
          typeof selectedGoalId === "number"
            ? (prev.currentAdmirerIndexByGoal[selectedGoalId] ?? 0)
            : 0,
        admirerCandidatesByGoal:
          typeof selectedGoalId === "number"
            ? { ...prev.admirerCandidatesByGoal, [selectedGoalId]: list }
            : prev.admirerCandidatesByGoal,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки тех, кто лайкнул тебя"

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        admirerCandidates: [],
        currentAdmirerIndex: 0,
        apiError: msg,
        admirerCandidatesByGoal:
          typeof selectedGoalId === "number"
            ? { ...prev.admirerCandidatesByGoal, [selectedGoalId]: [] }
            : prev.admirerCandidatesByGoal,
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

      const goalsFromApi: StudyGoal[] = Array.isArray(data?.goals)
        ? (data.goals as Array<{ id: number; name: string; description?: string | null; language?: string | null; isActive?: boolean; createdAt?: string }>)
            .map((goal) => ({
              id: Number(goal.id),
              name: goal.name || "",
              description: goal.description || "",
              language: goal.language || "",
              startDate: goal.createdAt || "",
              isActive: Boolean(goal.isActive),
            }))
            .filter((goal) => Boolean(goal.id) && Boolean(goal.name.trim()))
        : []

      const goals: StudyGoal[] = goalsFromApi.length > 0
        ? goalsFromApi
        : profile?.studyGoal
          ? [{ id: 1, name: profile.studyGoal, description: profile.bio || "", startDate: "", isActive: true }]
          : []
      const activeGoalIndexFromApi = goals.findIndex((goal) => goal.isActive)
      const activeGoalIndex = activeGoalIndexFromApi >= 0 ? activeGoalIndexFromApi : 0


      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        currentGoalIndex: goals.length > 0 ? activeGoalIndex : 0,
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
          motivation: Array.isArray(profile?.motivation) ? profile.motivation : [],
          learningStyle: Array.isArray(profile?.learningStyle) ? profile.learningStyle : [],
          organization: typeof profile?.organization === "number" ? profile.organization : 0,
          sociability: typeof profile?.sociability === "number" ? profile.sociability : 0,
          friendliness: typeof profile?.friendliness === "number" ? profile.friendliness : 0,
          stressResistance: typeof profile?.stressResistance === "number" ? profile.stressResistance : 0,
          additionalGoals: Array.isArray(profile?.additionalGoals) ? profile.additionalGoals : [],
          studyGoals: goals,
          bio: profile?.bio || "",
          avatarUrl: profile?.avatarUrl || "",
          learningFormat: profile?.learningFormat || preferences?.learningFormat || "",
          communicationStyle: profile?.communicationStyle || preferences?.communicationStyle || "",
          partnerLevel: preferences?.preferredLevel || "",
        },
      }))
      return goals[activeGoalIndex]?.id
    } catch (e) {
      console.error("Failed to load profile", e)

      setStateForSession(sessionVersion, (prev) => ({
        ...prev,
        user: defaultUser,
      }))
      return undefined
    }
  }, [setStateForSession])

  const loadProfile = useCallback(() => {
    return loadProfileForSession(sessionVersionRef.current).then(() => undefined)
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

          const activeGoalId = await loadProfileForSession(sessionVersion)
          if (!isSessionCurrent(sessionVersion)) {
            return
          }

          trackSessionReturn()

          await Promise.all([
            loadCandidatesForSession(sessionVersion, activeGoalId),
            loadFavoriteCandidatesForSession(sessionVersion, activeGoalId),
            loadAdmirerCandidatesForSession(sessionVersion, activeGoalId),
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


  const setActiveGoal = useCallback(async (goalId: number) => {
    const sessionVersion = sessionVersionRef.current
    await goalsAPI.setActive(goalId)
    const goalIndex = stateRef.current.user.studyGoals.findIndex((goal) => goal.id === goalId)
    if (goalIndex < 0) return

    setStateForSession(sessionVersion, (prev) => {
      const goals = prev.user.studyGoals.map((goal) => ({
        ...goal,
        isActive: goal.id === goalId,
      }))
      const candidates = prev.candidatesByGoal[goalId] ?? []
      const favoriteCandidates = prev.favoriteCandidatesByGoal[goalId] ?? []
      const admirerCandidates = prev.admirerCandidatesByGoal[goalId] ?? []

      return {
        ...prev,
        user: { ...prev.user, studyGoals: goals },
        currentGoalIndex: goalIndex,
        candidates,
        favoriteCandidates,
        admirerCandidates,
        currentCandidateIndex: prev.currentCandidateIndexByGoal[goalId] ?? 0,
        currentFavoriteIndex: prev.currentFavoriteIndexByGoal[goalId] ?? 0,
        currentAdmirerIndex: prev.currentAdmirerIndexByGoal[goalId] ?? 0,
      }
    })

    await Promise.all([
      loadCandidatesForSession(sessionVersion, goalId),
      loadFavoriteCandidatesForSession(sessionVersion, goalId),
      loadAdmirerCandidatesForSession(sessionVersion, goalId),
    ])
  }, [loadAdmirerCandidatesForSession, loadCandidatesForSession, loadFavoriteCandidatesForSession, setStateForSession])

  const updateStudyGoal = useCallback(async (goalId: number, goal: Omit<StudyGoal, "id">) => {
    await goalsAPI.update({
      goalId,
      name: goal.name,
      description: goal.description,
      language: goal.language,
    })

    const sessionVersion = sessionVersionRef.current
    const activeGoalId = await loadProfileForSession(sessionVersion)
    await Promise.all([
      loadCandidatesForSession(sessionVersion, activeGoalId),
      loadFavoriteCandidatesForSession(sessionVersion, activeGoalId),
      loadAdmirerCandidatesForSession(sessionVersion, activeGoalId),
    ])
  }, [
    loadAdmirerCandidatesForSession,
    loadCandidatesForSession,
    loadFavoriteCandidatesForSession,
    loadProfileForSession,
  ])

  const completeStudyGoal = useCallback(async (goalId: number) => {
    await goalsAPI.complete(goalId)

    const sessionVersion = sessionVersionRef.current
    const activeGoalId = await loadProfileForSession(sessionVersion)
    await Promise.all([
      loadCandidatesForSession(sessionVersion, activeGoalId),
      loadFavoriteCandidatesForSession(sessionVersion, activeGoalId),
      loadAdmirerCandidatesForSession(sessionVersion, activeGoalId),
    ])
  }, [
    loadAdmirerCandidatesForSession,
    loadCandidatesForSession,
    loadFavoriteCandidatesForSession,
    loadProfileForSession,
  ])

  const addStudyGoal = useCallback(async (goal: Omit<StudyGoal, "id">) => {
    try {
      const created = await goalsAPI.create({
        name: goal.name,
        description: goal.description,
        language: goal.language,
        makeActive: true,
      }) as { id: number; name: string; description?: string | null; language?: string | null; isActive?: boolean; createdAt?: string }

      const createdGoal: StudyGoal = {
        id: Number(created.id),
        name: created.name,
        description: created.description || "",
        language: created.language || goal.language || "",
        startDate: created.createdAt || goal.startDate || "",
        isActive: true,
      }

      setState((prev) => {
        const withoutDuplicates = prev.user.studyGoals.filter((item) => item.id !== createdGoal.id)
        const goals = [...withoutDuplicates.map((item) => ({ ...item, isActive: false })), createdGoal]

        return {
          ...prev,
          user: { ...prev.user, studyGoals: goals },
          currentGoalIndex: goals.length - 1,
        }
      })

      await Promise.all([
        loadCandidatesForSession(sessionVersionRef.current, createdGoal.id),
        loadFavoriteCandidatesForSession(sessionVersionRef.current, createdGoal.id),
        loadAdmirerCandidatesForSession(sessionVersionRef.current, createdGoal.id),
      ])
      return
    } catch (error) {
      if (!isNotFoundApiError(error)) {
        throw error
      }
    }

    // Fallback for outdated backend that doesn't have `goals.*` procedures yet
    await profileAPI.updateAboutMe({
      studyGoal: goal.name,
      bio: goal.description,
    })

    const sessionVersion = sessionVersionRef.current
    const activeGoalId = await loadProfileForSession(sessionVersion)
    await Promise.all([
      loadCandidatesForSession(sessionVersion, activeGoalId),
      loadFavoriteCandidatesForSession(sessionVersion, activeGoalId),
      loadAdmirerCandidatesForSession(sessionVersion, activeGoalId),
    ])
  }, [
    loadAdmirerCandidatesForSession,
    loadCandidatesForSession,
    loadFavoriteCandidatesForSession,
    loadProfileForSession,
    setState,
  ])


  const likeCurrent = useCallback(async (): Promise<{ matched: boolean; candidate: Candidate } | null> => {
    const current = stateRef.current
    const candidate = current.candidates[current.currentCandidateIndex]
    if (!candidate) return null


    const activeGoalId = current.user.studyGoals[current.currentGoalIndex]?.id
    setState((prev) => {
      const nextIndex = prev.currentCandidateIndex + 1
      const nextCandidateIndexByGoal =
        typeof activeGoalId === "number"
          ? { ...prev.currentCandidateIndexByGoal, [activeGoalId]: nextIndex }
          : prev.currentCandidateIndexByGoal

      return {
        ...prev,
        likedCandidates: [...prev.likedCandidates, candidate.id],
        currentCandidateIndex: nextIndex,
        currentCandidateIndexByGoal: nextCandidateIndexByGoal,
        favoriteCandidates: prev.favoriteCandidates.some((item) => item.id === candidate.id)
          ? prev.favoriteCandidates
          : [...prev.favoriteCandidates, { ...candidate, isFavorite: true }],
        favoriteCandidatesByGoal:
          typeof activeGoalId === "number"
            ? {
                ...prev.favoriteCandidatesByGoal,
                [activeGoalId]: (prev.favoriteCandidatesByGoal[activeGoalId] ?? prev.favoriteCandidates).some(
                  (item) => item.id === candidate.id,
                )
                  ? (prev.favoriteCandidatesByGoal[activeGoalId] ?? prev.favoriteCandidates)
                  : [...(prev.favoriteCandidatesByGoal[activeGoalId] ?? prev.favoriteCandidates), { ...candidate, isFavorite: true }],
              }
            : prev.favoriteCandidatesByGoal,
      }
    })


    try {
      const result = await favoritesAPI.like(candidate.id, activeGoalId) as { matched?: boolean } | null
      const matched = Boolean(result?.matched)

      if (matched) {
        setState((prev) => ({
          ...prev,
          matchedCandidate: { ...candidate, isFavorite: true },
        }))
      }

      return { matched, candidate }
    } catch (error) {
      console.error(error)
      return { matched: false, candidate }
    }
  }, [])


  const rejectCurrent = useCallback(() => {
    const activeGoalId = stateRef.current.user.studyGoals[stateRef.current.currentGoalIndex]?.id
    setState((prev) => {
      const nextIndex = prev.currentCandidateIndex + 1
      return {
        ...prev,
        currentCandidateIndex: nextIndex,
        currentCandidateIndexByGoal:
          typeof activeGoalId === "number"
            ? { ...prev.currentCandidateIndexByGoal, [activeGoalId]: nextIndex }
            : prev.currentCandidateIndexByGoal,
      }
    })
  }, [])


  const nextCandidate = useCallback(() => {
    const activeGoalId = stateRef.current.user.studyGoals[stateRef.current.currentGoalIndex]?.id
    setState((prev) => {
      const nextIndex = prev.currentCandidateIndex + 1
      return {
        ...prev,
        currentCandidateIndex: nextIndex,
        currentCandidateIndexByGoal:
          typeof activeGoalId === "number"
            ? { ...prev.currentCandidateIndexByGoal, [activeGoalId]: nextIndex }
            : prev.currentCandidateIndexByGoal,
      }
    })
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

    const activeGoalId = await loadProfileForSession(sessionVersion)
    if (!isSessionCurrent(sessionVersion)) {
      return
    }

    await Promise.all([
      loadCandidatesForSession(sessionVersion, activeGoalId),
      loadFavoriteCandidatesForSession(sessionVersion, activeGoalId),
      loadAdmirerCandidatesForSession(sessionVersion, activeGoalId),
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
    const activeGoal = u.studyGoals[stateRef.current.currentGoalIndex] ?? u.studyGoals[0]
    await profileAPI.updateAboutMe({
      firstName: u.firstName,
      lastName: u.lastName,
      age: u.age ?? undefined,
      city: u.city,
      university: u.university,
      program: u.program,
      course: u.course,
      messengerHandle: u.messengerHandle,
      studyGoal: activeGoal?.name ?? "",
      proficiencyLevel: u.knowledgeLevel,
      schedule: u.preferredTime,
      motivation: u.motivation,
      learningStyle: u.learningStyle,
      additionalGoals: u.additionalGoals,
      organization: u.organization,
      sociability: u.sociability,
      friendliness: u.friendliness,
      stressResistance: u.stressResistance,
      learningFormat: u.learningFormat,
      communicationStyle: u.communicationStyle,
      bio: activeGoal?.description || u.bio,
      avatarUrl: u.avatarUrl,
    })

    if (activeGoal?.id) {
      try {
        await goalsAPI.setActive(activeGoal.id)
      } catch (error) {
        if (!isNotFoundApiError(error)) {
          throw error
        }
      }
    }
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
        setActiveGoal,
        updateStudyGoal,
        completeStudyGoal,
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
