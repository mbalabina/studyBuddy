"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

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
  // Survey 1 answers
  preferredTime: string[]
  motivation: string[]
  knowledgeLevel: string
  learningStyle: string[]
  organization: number
  sociability: number
  friendliness: number
  stressResistance: number
  // Survey 2 answers
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
}

// ========== MOCK DATA ==========
export const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: "Катя Сафонова",
    age: 18,
    city: "Москва",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face",
    compatibility: 87,
    university: "ФКН ВШЭ",
    course: "3 курс",
    goal: "IELTS",
    goalDescription: "Хочу подготовиться за 3 месяца, мне нужен напарник для тестов и спикинг клаба",
    telegram: "@kateSafonova",
  },
  {
    id: 2,
    name: "Катя Семенова",
    age: 19,
    city: "Москва",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
    compatibility: 84,
    university: "МГУ",
    course: "2 курс",
    goal: "IELTS",
    goalDescription: "Ищу партнера для подготовки к IELTS, writing и speaking",
    telegram: "@kateSemenova",
  },
  {
    id: 3,
    name: "Женя Сафонова",
    age: 18,
    city: "Москва",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face",
    compatibility: 79,
    university: "МФТИ",
    course: "1 курс",
    goal: "IELTS",
    goalDescription: "Нужен бадди для практики разговорного английского",
    telegram: "@zhenyaSafonova",
  },
  {
    id: 4,
    name: "Женя Семенова",
    age: 18,
    city: "Москва",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
    compatibility: 75,
    university: "РАНХиГС",
    course: "2 курс",
    goal: "IELTS",
    goalDescription: "Хочу сдать IELTS на 7+, ищу мотивированного напарника",
    telegram: "@zhenyaSemenova",
  },
  {
    id: 5,
    name: "Игорь Сафонов",
    age: 18,
    city: "Москва",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
    compatibility: 71,
    university: "МГИМО",
    course: "4 курс",
    goal: "IELTS",
    goalDescription: "Готовлюсь к IELTS Academic, нужен партнер для writing practice",
    telegram: "@igorSafonov",
  },
]

// ========== CONTEXT ==========
interface AppState {
  screen: AppScreen
  user: UserProfile
  currentGoalIndex: number
  currentCandidateIndex: number
  likedCandidates: number[]
  matchedCandidate: Candidate | null
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
  })

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
    setState((prev) => {
      const candidate = mockCandidates[prev.currentCandidateIndex]
      if (!candidate) return prev
      return {
        ...prev,
        likedCandidates: [...prev.likedCandidates, candidate.id],
        currentCandidateIndex: prev.currentCandidateIndex + 1,
      }
    })
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

  return (
    <AppContext.Provider
      value={{ state, setScreen, updateUser, addStudyGoal, likeCurrent, rejectCurrent, nextCandidate, setState }}
    >
      {children}
    </AppContext.Provider>
  )
}
