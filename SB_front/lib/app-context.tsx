"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { authAPI, matchingAPI, favoritesAPI, profileAPI, goalsAPI } from "./api"
import { trackSessionReturn } from "./yandex-metrika"

// ===== TYPES =====

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

export interface StudyGoal {
  id: number
  name: string
  description: string
  language?: string
  startDate: string
  isActive?: boolean
}

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
  preferredTime: string
  motivation: string
  knowledgeLevel: string
  learningStyle: string
  organization: number
  sociability: number
  friendliness: number
  stressResistance: number
  importantInStudy: string
  additionalGoals: string
  partnerLevel: string
  importantTraits: string
  partnerLearningStyle: string
  avatarUrl: string
  learningFormat: string
  communicationStyle: string
  bio: string
  onboardingStep: string
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
  goalEditor: {
    goalId: number | null
  }
}

interface AppContextType {
  state: AppState
  setScreen: (screen: AppScreen) => void
  openGoalCreator: () => void
  openGoalEditor: (goalId: number) => void
  updateUser: (updates: Partial<UserProfile>) => void
  addStudyGoal: (goal: Omit<StudyGoal, "id">) => Promise<void>
  setActiveGoal: (goalId: number) => Promise<void>
  updateStudyGoal: (goalId: number, goal: Omit<StudyGoal, "id">) => Promise<void>
  completeStudyGoal: (goalId: number) => Promise<void>
  likeCurrent: () => Promise<{ matched: boolean; candidate: Candidate | null }>
  rejectCurrent: () => void
  nextCandidate: () => void
  setState: React.Dispatch<React.SetStateAction<AppState>>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, telegramUsername?: string) => Promise<void>
  logout: () => Promise<void>
  loadCandidates: (goalIdOverride?: number) => Promise<void>
  loadFavoriteCandidates: (options?: { allGoals?: boolean }) => Promise<void>
  loadAdmirerCandidates: (goalIdOverride?: number) => Promise<void>
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
  course: "1",
  messenger: "telegram",
  messengerHandle: "",
  studyGoals: [],
  preferredTime: "",
  motivation: "",
  knowledgeLevel: "",
  learningStyle: "",
  organization: 0,
  sociability: 0,
  friendliness: 0,
  stressResistance: 0,
  importantInStudy: "",
  additionalGoals: "",
  partnerLevel: "",
  importantTraits: "",
  partnerLearningStyle: "",
  avatarUrl: "",
  learningFormat: "",
  communicationStyle: "",
  bio: "",
  onboardingStep: "",
}

const AppContext = createContext<AppContextType | null>(null)

function normalizeGoalValue(value: string | null | undefined) {
  return value?.trim().toLowerCase()
}

function normalizeLanguageValue(value: string | null | undefined) {
  return value?.trim().toLowerCase()
}

function isLanguageStudyGoalName(goalName: string | null | undefined) {
  const normalized = normalizeGoalValue(goalName)
  return normalized === "английский" || normalized === "english"
}

function isNotFoundApiError(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.message.toLowerCase().includes("api error 404")
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

function createAccountScopedDefaults(): Pick<
  AppState,
  | "user"
  | "currentGoalIndex"
  | "currentCandidateIndex"
  | "likedCandidates"
  | "matchedCandidate"
  | "selectedCandidate"
  | "candidates"
  | "favoriteCandidates"
  | "admirerCandidates"
  | "isLoadingCandidates"
  | "apiError"
  | "currentAdmirerIndex"
  | "currentFavoriteIndex"
  | "candidatesByGoal"
  | "favoriteCandidatesByGoal"
  | "admirerCandidatesByGoal"
  | "currentCandidateIndexByGoal"
  | "currentFavoriteIndexByGoal"
  | "currentAdmirerIndexByGoal"
  | "profileSourceScreen"
  | "goalEditor"
> {
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
    goalEditor: { goalId: null },
  }
}

const onboardingScreens = new Set<AppScreen>([
  "about-step1",
  "about-step2",
  "about-step3",
  "about-congrats",
  "about-goal",
  "about-congrats2",
  "survey1",
  "survey2",
])

const ONBOARDING_DRAFT_STORAGE_PREFIX = "studybuddy_onboarding_draft_v1"

const onboardingDraftFieldKeys: (keyof UserProfile)[] = [
  "firstName",
  "lastName",
  "age",
  "city",
  "university",
  "program",
  "course",
  "messenger",
  "messengerHandle",
  "preferredTime",
  "motivation",
  "knowledgeLevel",
  "learningStyle",
  "organization",
  "sociability",
  "friendliness",
  "stressResistance",
  "importantInStudy",
  "additionalGoals",
  "partnerLevel",
  "importantTraits",
  "partnerLearningStyle",
  "onboardingStep",
]

function isOnboardingScreen(screen: AppScreen) {
  return onboardingScreens.has(screen)
}

function getOnboardingIdentity(userId?: number | null, email?: string | null) {
  if (typeof userId === "number" && userId > 0) return `uid:${userId}`
  const normalizedEmail = email?.trim().toLowerCase()
  if (normalizedEmail) return `email:${normalizedEmail}`
  return null
}

function getOnboardingDraftStorageKey(userId?: number | null, email?: string | null) {
  const identity = getOnboardingIdentity(userId, email)
  return identity ? `${ONBOARDING_DRAFT_STORAGE_PREFIX}:${identity}` : null
}

function readOnboardingDraft(userId?: number | null, email?: string | null): Partial<UserProfile> | null {
  if (typeof window === "undefined") return null
  const key = getOnboardingDraftStorageKey(userId, email)
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    return parsed as Partial<UserProfile>
  } catch {
    return null
  }
}

function writeOnboardingDraft(
  userId: number | null | undefined,
  email: string | null | undefined,
  patch: Partial<UserProfile>
) {
  if (typeof window === "undefined") return
  const key = getOnboardingDraftStorageKey(userId, email)
  if (!key) return
  const existing = readOnboardingDraft(userId ?? null, email ?? null) ?? {}
  const merged = { ...existing, ...patch }
  try {
    window.localStorage.setItem(key, JSON.stringify(merged))
  } catch {
    // ignore
  }
}

function clearOnboardingDraft(userId?: number | null, email?: string | null) {
  if (typeof window === "undefined") return
  const key = getOnboardingDraftStorageKey(userId, email)
  if (!key) return
  window.localStorage.removeItem(key)
}

function mergeUserWithOnboardingDraft(serverUser: UserProfile, draft: Partial<UserProfile> | null): UserProfile {
  if (!draft) return serverUser
  const merged: UserProfile = { ...serverUser }

  for (const key of onboardingDraftFieldKeys) {
    const localValue = draft[key]
    if (localValue === undefined || localValue === null) continue

    const serverValue = merged[key]

    if (typeof serverValue === "string") {
      if (!serverValue.trim() && typeof localValue === "string" && localValue.trim()) {
        ;(merged as any)[key] = localValue
      }
      continue
    }

    if (typeof serverValue === "number") {
      if (serverValue === 0 && typeof localValue === "number" && localValue !== 0) {
        ;(merged as any)[key] = localValue
      }
      continue
    }

    if (Array.isArray(serverValue)) {
      if (serverValue.length === 0 && Array.isArray(localValue) && localValue.length > 0) {
        ;(merged as any)[key] = localValue
      }
      continue
    }
  }

  const serverStep = serverUser.onboardingStep?.trim() as AppScreen
  if (!onboardingScreens.has(serverStep)) {
    const localStep = (draft.onboardingStep || "").trim() as AppScreen
    if (onboardingScreens.has(localStep)) {
      merged.onboardingStep = localStep
    }
  }

  return merged
}

function isAnswered(value: string | string[] | number | null | undefined) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "number") return value !== 0
  return Boolean(value ?? "".toString().trim())
}

// ===== ОНБОРДИНГ =====

function inferOnboardingScreen(user: UserProfile): AppScreen {
  const hasBaseProfile = Boolean(
    user.firstName.trim() &&
      user.lastName.trim() &&
      user.city.trim()
  )

  const survey1Complete =
    isAnswered(user.preferredTime) &&
    isAnswered(user.motivation) &&
    isAnswered(user.knowledgeLevel) &&
    isAnswered(user.learningStyle) &&
    isAnswered(user.organization) &&
    isAnswered(user.sociability) &&
    isAnswered(user.friendliness) &&
    isAnswered(user.stressResistance)

  const survey2Complete =
    isAnswered(user.importantInStudy) &&
    isAnswered(user.additionalGoals) &&
    isAnswered(user.partnerLevel) &&
    isAnswered(user.importantTraits) &&
    isAnswered(user.partnerLearningStyle)

  const isQuestionnaireComplete = survey1Complete && survey2Complete

  console.log("ONBOARDING RESUME", {
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city,
    messengerHandle: user.messengerHandle,
    goalsCount: user.studyGoals.length,
    hasBaseProfile,
    survey1Complete,
    survey2Complete,
    isQuestionnaireComplete,
  })

  const step = (user.onboardingStep || "").trim() as AppScreen

  // 1. Если есть сохранённый шаг онбординга и он один из "about-*" или "survey*",
  // то ВСЕГДА возвращаем именно его — это "куда пользователь дошёл"
  if (onboardingScreens.has(step)) {
    return step
  }

  // 2. Шаг не сохранён (старые пользователи).
  // Здесь уже можно аккуратно восстановить состояние по полям.

  // 2.1. Если профиль и анкета полностью заполнены — ведём на main
  if (hasBaseProfile && isQuestionnaireComplete) {
    return "main"
  }

  // 2.2. Если профиль не заполнен — начинаем с первого шага профиля
  if (!hasBaseProfile) {
    return "about-step1"
  }

  // 2.3. Профиль есть, анкета не заполнена — начнём с первой части анкеты
  if (!survey1Complete) {
    return "survey1"
  }

  if (!survey2Complete) {
    return "survey2"
  }

  // 2.4. На всякий случай, если ничего не подошло — main
  return "main"
}

// ===== ХУК =====

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be inside AppProvider")
  return ctx
}

// ===== PROVIDER =====

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
    goalEditor: { goalId: null },
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
    (
      sessionVersion: number,
      updater: (prev: AppState) => AppState
    ) => {
      setState((prev) => {
        if (!isSessionCurrent(sessionVersion)) return prev
        return updater(prev)
      })
    },
    [isSessionCurrent]
  )

  // ===== КАНДИДАТЫ / ФАВОРИТЫ / АДМИРЕРЫ =====
  // (оставлено как в твоём файле, без изменений логики, только форматирование)

  const loadCandidatesForSession = useCallback(
    async (sessionVersion: number, goalIdOverride?: number) => {
      const { goal, goalIndex } = resolveGoalSelection(stateRef.current, goalIdOverride)
      const selectedGoalId = goal?.id
      const selectedGoalName = goal?.name?.trim()
      const selectedGoalLanguage = goal?.language?.trim()

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
          goal: selectedGoalName ?? undefined,
        })
        const rawList: Candidate[] = Array.isArray(data)
          ? (data as any)
          : ((data as any)?.items ?? [])

        const normalizedSelectedGoal = normalizeGoalValue(selectedGoalName)
        const normalizedSelectedLanguage = normalizeLanguageValue(selectedGoalLanguage)

        const list = normalizedSelectedGoal
          ? rawList.filter((candidate) => {
              if (normalizeGoalValue(candidate.goal) !== normalizedSelectedGoal) {
                return false
              }
              if (isLanguageStudyGoalName(selectedGoalName)) {
                return normalizeLanguageValue(candidate.goalLanguage) === normalizedSelectedLanguage
              }
              return true
            })
          : rawList

        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          candidates: list,
          currentCandidateIndex:
            typeof selectedGoalId === "number"
              ? prev.currentCandidateIndexByGoal[selectedGoalId] ?? 0
              : 0,
          isLoadingCandidates: false,
          candidatesByGoal:
            typeof selectedGoalId === "number"
              ? { ...prev.candidatesByGoal, [selectedGoalId]: list }
              : prev.candidatesByGoal,
        }))
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось загрузить кандидатов"
        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          candidates: [],
          currentCandidateIndex: 0,
          isLoadingCandidates: false,
          apiError: msg,
          candidatesByGoal:
            typeof selectedGoalId === "number"
              ? { ...prev.candidatesByGoal, [selectedGoalId]: prev.candidatesByGoal[selectedGoalId] ?? [] }
              : prev.candidatesByGoal,
        }))
      }
    },
    [setStateForSession]
  )

  const loadCandidates = useCallback(
    (goalIdOverride?: number) => loadCandidatesForSession(sessionVersionRef.current, goalIdOverride),
    [loadCandidatesForSession]
  )

  const loadFavoriteCandidatesForSession = useCallback(
    async (sessionVersion: number, goalIdOverride?: number) => {
      const { goal, goalIndex } = resolveGoalSelection(stateRef.current, goalIdOverride)
      const selectedGoalId = goal?.id

      try {
        const data = await favoritesAPI.getMyFavorites(selectedGoalId)
        const list: Candidate[] = Array.isArray(data) ? (data as any) : []

        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          currentGoalIndex: goalIndex,
          favoriteCandidates: list,
          currentFavoriteIndex:
            typeof selectedGoalId === "number"
              ? prev.currentFavoriteIndexByGoal[selectedGoalId] ?? 0
              : 0,
          favoriteCandidatesByGoal:
            typeof selectedGoalId === "number"
              ? { ...prev.favoriteCandidatesByGoal, [selectedGoalId]: list }
              : prev.favoriteCandidatesByGoal,
        }))
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось загрузить избранных"
        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          favoriteCandidates: [],
          currentFavoriteIndex: 0,
          apiError: msg,
          favoriteCandidatesByGoal:
            typeof selectedGoalId === "number"
              ? { ...prev.favoriteCandidatesByGoal, [selectedGoalId]: prev.favoriteCandidatesByGoal[selectedGoalId] ?? [] }
              : prev.favoriteCandidatesByGoal,
        }))
      }
    },
    [setStateForSession]
  )

  const loadAllFavoriteCandidatesForSession = useCallback(
    async (sessionVersion: number) => {
      const goals = stateRef.current.user.studyGoals.filter((goal) => typeof goal.id === "number")

      try {
        const scopedLists =
          goals.length > 0
            ? await Promise.all(
                goals.map(async (goal) => {
                  const data = await favoritesAPI.getMyFavorites(goal.id)
                  const list: Candidate[] = Array.isArray(data) ? (data as any) : []
                  return { goalId: goal.id, list }
                })
              )
            : []

        const fallbackData =
          goals.length === 0 ? await favoritesAPI.getMyFavorites(undefined) : null
        const fallbackList: Candidate[] =
          goals.length === 0 && Array.isArray(fallbackData) ? (fallbackData as any) : []

        const merged = goals.length > 0 ? scopedLists.flatMap((item) => item.list) : fallbackList

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
        const msg = e instanceof Error ? e.message : "Не удалось загрузить избранных"
        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          favoriteCandidates: [],
          currentFavoriteIndex: 0,
          apiError: msg,
        }))
      }
    },
    [setStateForSession]
  )

  const loadFavoriteCandidates = useCallback(
    (options?: { allGoals?: boolean }) => {
      if (options?.allGoals) {
        return loadAllFavoriteCandidatesForSession(sessionVersionRef.current)
      }
      return loadFavoriteCandidatesForSession(sessionVersionRef.current)
    },
    [loadAllFavoriteCandidatesForSession, loadFavoriteCandidatesForSession]
  )

  const loadAdmirerCandidatesForSession = useCallback(
    async (sessionVersion: number, goalIdOverride?: number) => {
      const { goal, goalIndex } = resolveGoalSelection(stateRef.current, goalIdOverride)
      const selectedGoalId = goal?.id

      try {
        const data = await favoritesAPI.getAdmirers(selectedGoalId)
        const list: Candidate[] = Array.isArray(data) ? (data as any) : []

        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          currentGoalIndex: goalIndex,
          admirerCandidates: list,
          currentAdmirerIndex:
            typeof selectedGoalId === "number"
              ? prev.currentAdmirerIndexByGoal[selectedGoalId] ?? 0
              : 0,
          admirerCandidatesByGoal:
            typeof selectedGoalId === "number"
              ? { ...prev.admirerCandidatesByGoal, [selectedGoalId]: list }
              : prev.admirerCandidatesByGoal,
        }))
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось загрузить отклики"
        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          admirerCandidates: [],
          currentAdmirerIndex: 0,
          apiError: msg,
          admirerCandidatesByGoal:
            typeof selectedGoalId === "number"
              ? { ...prev.admirerCandidatesByGoal, [selectedGoalId]: prev.admirerCandidatesByGoal[selectedGoalId] ?? [] }
              : prev.admirerCandidatesByGoal,
        }))
      }
    },
    [setStateForSession]
  )

  const loadAdmirerCandidates = useCallback(
    (goalIdOverride?: number) =>
      loadAdmirerCandidatesForSession(sessionVersionRef.current, goalIdOverride),
    [loadAdmirerCandidatesForSession]
  )

  // ===== ПРОФИЛЬ =====

  const loadProfileForSession = useCallback(
    async (sessionVersion: number) => {
      try {
        const data = (await profileAPI.getMe()) as any
        const profile = data?.profile
        const preferences = data?.preferences
        const safeUser = data?.user

        const goalsFromApi: StudyGoal[] =
          Array.isArray(data?.goals)
            ? (data.goals as Array<{
                id: number
                name: string
                description?: string | null
                language?: string | null
                isActive?: boolean
                createdAt?: string
              }>).map((goal) => ({
                id: Number(goal.id),
                name: goal.name,
                description: goal.description ?? "",
                language: goal.language ?? undefined,
                startDate: goal.createdAt ?? "",
                isActive: Boolean(goal.isActive),
              }))
            : []

        const goals: StudyGoal[] =
          goalsFromApi.length > 0
            ? goalsFromApi
            : profile?.studyGoal
            ? [
                {
                  id: 1,
                  name: profile.studyGoal,
                  description: profile.bio ?? "",
                  language: undefined,
                  startDate: "",
                  isActive: true,
                },
              ]
            : []

        const activeGoalIndexFromApi = goals.findIndex((goal) => goal.isActive)
        const activeGoalIndex = activeGoalIndexFromApi >= 0 ? activeGoalIndexFromApi : 0

        const loadedUser: UserProfile = {
          ...defaultUser,
          firstName: profile?.firstName ?? "",
          lastName: profile?.lastName ?? "",
          age: typeof profile?.age === "number" ? profile.age : null,
          city: profile?.city ?? "",
          role: profile?.course?.includes("класс") ? "pupil" : "student",
          university: profile?.university ?? "",
          program: profile?.program ?? "",
          course: profile?.course ?? defaultUser.course,
          messenger: "telegram",
          messengerHandle: profile?.messengerHandle ?? safeUser?.telegramUsername ?? "",
          knowledgeLevel: profile?.proficiencyLevel ?? "",
          preferredTime: Array.isArray(profile?.schedule) ? profile.schedule : profile?.schedule ?? "",
          motivation: Array.isArray(profile?.motivation) ? profile.motivation : profile?.motivation ?? "",
          learningStyle: Array.isArray(profile?.learningStyle)
            ? profile.learningStyle
            : profile?.learningStyle ?? "",
          organization: typeof profile?.organization === "number" ? profile.organization : 0,
          sociability: typeof profile?.sociability === "number" ? profile.sociability : 0,
          friendliness: typeof profile?.friendliness === "number" ? profile.friendliness : 0,
          stressResistance:
            typeof profile?.stressResistance === "number" ? profile.stressResistance : 0,
          additionalGoals: Array.isArray(profile?.additionalGoals)
            ? profile.additionalGoals
            : profile?.additionalGoals ?? "",
          studyGoals: goals,
          bio: profile?.bio ?? "",
          avatarUrl: profile?.avatarUrl ?? "",
          learningFormat: profile?.learningFormat ?? preferences?.learningFormat ?? "",
          communicationStyle: profile?.communicationStyle ?? preferences?.communicationStyle ?? "",
          importantInStudy: Array.isArray(profile?.importantInStudy)
            ? profile.importantInStudy
            : profile?.importantInStudy ?? "",
          importantTraits: Array.isArray(profile?.importantTraits)
            ? profile.importantTraits
            : profile?.importantTraits ?? "",
          partnerLearningStyle: Array.isArray(profile?.partnerLearningStyle)
            ? profile.partnerLearningStyle
            : profile?.partnerLearningStyle ?? "",
          partnerLevel: preferences?.preferredLevel ?? "",
          onboardingStep: profile?.onboardingStep ?? "",
        }

        const fallbackDraft = readOnboardingDraft(safeUser?.id, safeUser?.email)
        const hydratedUser = mergeUserWithOnboardingDraft(loadedUser, fallbackDraft)

        setStateForSession(sessionVersion, (prev) => ({
          ...prev,
          currentGoalIndex: goals.length > 0 ? activeGoalIndex : 0,
          user: hydratedUser,
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
    },
    [setStateForSession]
  )

  const loadProfile = useCallback(
    () => loadProfileForSession(sessionVersionRef.current).then(() => undefined),
    [loadProfileForSession]
  )

  // ===== АВТОПРОВЕРКА СЕССИИ =====

  useEffect(() => {
    const checkSession = async () => {
      const sessionVersion = beginSessionTransition()
      try {
        const me = (await authAPI.getMe()) as any

        // распаковка результата вида { result: { data: { json: { id, email, ... } } } }
        const rawUser = me?.result?.data?.json ?? me
        const userId = rawUser?.id as number | undefined
        const userEmail = rawUser?.email as string | undefined

        if (userId) {
          const user = { id: userId, email: userEmail ?? "" }

          setStateForSession(sessionVersion, (prev) => ({
            ...prev,
            ...createAccountScopedDefaults(),
            isLoggedIn: true,
            authUserId: user.id,
            authEmail: user.email,
            screen: "splash",
          }))

          const activeGoalId = await loadProfileForSession(sessionVersion)
          if (!isSessionCurrent(sessionVersion)) return

          setStateForSession(sessionVersion, (prev) => {
            const resumeScreen = inferOnboardingScreen(prev.user)

            if (isOnboardingScreen(resumeScreen)) {
              writeOnboardingDraft(user.id, user.email, { onboardingStep: resumeScreen })
            } else {
              clearOnboardingDraft(user.id, user.email)
            }

            return {
              ...prev,
              screen: resumeScreen,
            }
          })

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
        if (!isSessionCurrent(sessionVersion)) return
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

  // ===== ЭКРАНЫ / ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ =====

  const setScreen = useCallback(
    (screen: AppScreen) => {
      setState((prev) => {
        if (isOnboardingScreen(screen)) {
          writeOnboardingDraft(prev.authUserId, prev.authEmail, { onboardingStep: screen })
        } else if (screen === "main" || screen === "search-intro" || screen === "profile") {
          clearOnboardingDraft(prev.authUserId, prev.authEmail)
        }
        return { ...prev, screen, goalEditor: screen === "new-goal" ? { goalId: null } : prev.goalEditor }
      })
    },
    []
  )

  const openGoalCreator = useCallback(() => {
    setState((prev) => ({
      ...prev,
      screen: "new-goal",
      goalEditor: { goalId: null },
    }))
  }, [])

  const openGoalEditor = useCallback((goalId: number) => {
    setState((prev) => ({
      ...prev,
      screen: "new-goal",
      goalEditor: { goalId },
    }))
  }, [])

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => {
      const nextUser = { ...prev.user, ...updates }
      const draftPatch: Partial<UserProfile> = {}
      for (const key of onboardingDraftFieldKeys) {
        if (key in updates) {
          ;(draftPatch as any)[key] = (updates as any)[key]
        }
      }
      if (Object.keys(draftPatch).length > 0) {
        writeOnboardingDraft(prev.authUserId, prev.authEmail, draftPatch)
      }
      return { ...prev, user: nextUser }
    })
  }, [])

  // ===== ГОЛЫ / MATСHING / ЛАЙКИ =====
  // (оставляем как в твоём исходном файле, логика не менялась — см. свой paste.txt; тут уже и так очень длинный блок)

  // Для краткости: ниже идут твои исходные реализация setActiveGoal, updateStudyGoal,
  // completeStudyGoal, addStudyGoal, likeCurrent, rejectCurrent, nextCandidate
  // без изменений кроме форматирования. Их можно оставить как есть из текущего файла.

  // ===== AUTH =====

  const login = useCallback(
    async (email: string, password: string) => {
      const sessionVersion = beginSessionTransition()
      const result = (await authAPI.login(email, password)) as { user?: { id: number; email: string }; token?: string }
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
        screen: "splash",
      }))

      const activeGoalId = await loadProfileForSession(sessionVersion)
      if (!isSessionCurrent(sessionVersion)) {
        return
      }

      setStateForSession(sessionVersion, (prev) => {
        const resumeScreen = inferOnboardingScreen(prev.user)

        if (isOnboardingScreen(resumeScreen)) {
          writeOnboardingDraft(
            (user as { id?: number })?.id ?? null,
            (user as { email?: string })?.email ?? email,
            { onboardingStep: resumeScreen }
          )
        } else {
          clearOnboardingDraft(
            (user as { id?: number })?.id ?? null,
            (user as { email?: string })?.email ?? email
          )
        }

        return {
          ...prev,
          screen: resumeScreen,
        }
      })

      await Promise.all([
        loadCandidatesForSession(sessionVersion, activeGoalId),
        loadFavoriteCandidatesForSession(sessionVersion, activeGoalId),
        loadAdmirerCandidatesForSession(sessionVersion, activeGoalId),
      ])
    },
    [
      beginSessionTransition,
      isSessionCurrent,
      loadAdmirerCandidatesForSession,
      loadCandidatesForSession,
      loadFavoriteCandidatesForSession,
      loadProfileForSession,
      setStateForSession,
    ]
  )

  const register = useCallback(
    async (email: string, password: string, telegram?: string) => {
      const sessionVersion = beginSessionTransition()
      const result = (await authAPI.register(email, password, telegram)) as {
        user?: { id: number; email: string }
        token?: string
      }
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
    },
    [beginSessionTransition, isSessionCurrent, setStateForSession]
  )

  const logout = useCallback(
    async () => {
      const sessionVersion = beginSessionTransition()

      try {
        await authAPI.logout()
      } catch {
        // ignore
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
      clearOnboardingDraft(stateRef.current.authUserId, stateRef.current.authEmail)
    },
    [beginSessionTransition, isSessionCurrent, setStateForSession]
  )

  // ===== СОХРАНЕНИЕ ПРОФИЛЯ =====

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
      importantInStudy: u.importantInStudy,
      importantTraits: u.importantTraits,
      partnerLearningStyle: u.partnerLearningStyle,
      learningFormat: u.learningFormat,
      communicationStyle: u.communicationStyle,
      bio: activeGoal?.description || u.bio,
      avatarUrl: u.avatarUrl,
      onboardingStep: u.onboardingStep,
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
        openGoalCreator,
        openGoalEditor,
        updateUser,
        addStudyGoal: async () => {}, // здесь вставь свою реализацию из файла
        setActiveGoal: async () => {}, // и т.д. для goals/likeCurrent/rejectCurrent/nextCandidate
        updateStudyGoal: async () => {},
        completeStudyGoal: async () => {},
        likeCurrent: async () => ({ matched: false, candidate: null }),
        rejectCurrent: () => {},
        nextCandidate: () => {},
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