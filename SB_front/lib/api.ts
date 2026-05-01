const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3000"

function normalizeApiUrl(url: string) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
    return url
  }

  const isLocalHost =
    url.startsWith("localhost") ||
    url.startsWith("127.0.0.1") ||
    url.startsWith("0.0.0.0")

  return `${isLocalHost ? "http" : "https"}://${url}`
}

const API_URL = normalizeApiUrl(RAW_API_URL)
const AUTH_TOKEN_KEY = "studybuddy_auth_token"

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    return
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

async function callTRPC({
  method,
  procedure,
  input,
}: {
  method: "query" | "mutation"
  procedure: string
  input?: unknown
}) {
  const wrappedInput = input !== undefined ? { json: input } : undefined
  let url = `${API_URL}/api/trpc/${procedure}`

  if (method === "query" && wrappedInput !== undefined) {
    url += `?input=${encodeURIComponent(JSON.stringify(wrappedInput))}`
  }

  const options: RequestInit = {
    method: method === "query" ? "GET" : "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  }

  const token = getAuthToken()
  if (token) {
    ;(options.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  if (method === "mutation" && wrappedInput !== undefined) {
    options.body = JSON.stringify(wrappedInput)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error?.message || `API Error: ${response.status}`)
  }

  const data = await response.json()
  return data.result?.data?.json ?? data.result?.data ?? data
}

export const authAPI = {
  register: async (email: string, password: string, telegramUsername?: string) => {
    const result = await callTRPC({
      method: "mutation",
      procedure: "auth.register",
      input: { email, password, telegramUsername },
    })
    const token = (result as { token?: string })?.token
    if (token) setAuthToken(token)
    return result
  },
  login: async (email: string, password: string) => {
    const result = await callTRPC({ method: "mutation", procedure: "auth.login", input: { email, password } })
    const token = (result as { token?: string })?.token
    if (token) setAuthToken(token)
    return result
  },
  requestPasswordReset: (email: string) =>
    callTRPC({ method: "mutation", procedure: "auth.requestPasswordReset", input: { email } }),
  resetPasswordWithCode: async (email: string, code: string, newPassword: string) => {
    const result = await callTRPC({
      method: "mutation",
      procedure: "auth.resetPasswordWithCode",
      input: { email, code, newPassword },
    })
    const token = (result as { token?: string })?.token
    if (token) setAuthToken(token)
    return result
  },
  logout: async () => {
    try {
      return await callTRPC({ method: "mutation", procedure: "auth.logout" })
    } finally {
      setAuthToken(null)
    }
  },
  getMe: () =>
    callTRPC({ method: "query", procedure: "auth.me" }),
}

export const profileAPI = {
  getMe: () =>
    callTRPC({ method: "query", procedure: "profile.getMe" }),

  updateAboutMe: (data: {
    firstName?: string
    lastName?: string
    age?: number
    city?: string
    studyGoal?: string
    proficiencyLevel?: string
    subjects?: string[]
    schedule?: string[]
    motivation?: string[]
    learningStyle?: string[]
    additionalGoals?: string[]
    importantInStudy?: string[]
    importantTraits?: string[]
    partnerLearningStyle?: string[]
    organization?: number
    sociability?: number
    friendliness?: number
    stressResistance?: number
    bio?: string
    experience?: string
    avatarUrl?: string
    university?: string
    program?: string
    course?: string
    messengerHandle?: string
    learningFormat?: string
    communicationStyle?: string
    onboardingStep?: string
  }) =>
    callTRPC({ method: "mutation", procedure: "profile.updateAboutMe", input: data }),

  updatePartnerPreferences: (data: any) =>
    callTRPC({ method: "mutation", procedure: "profile.updatePartnerPreferences", input: data }),
}

export const goalsAPI = {
  list: () =>
    callTRPC({ method: "query", procedure: "goals.list" }),
  create: (data: { name: string; description?: string; language?: string; makeActive?: boolean }) =>
    callTRPC({ method: "mutation", procedure: "goals.create", input: data }),
  setActive: (goalId: number) =>
    callTRPC({ method: "mutation", procedure: "goals.setActive", input: { goalId } }),
}

export const matchingAPI = {
  getCandidates: (params?: { limit?: number; offset?: number; goal?: string; goalId?: number }) =>
    callTRPC({ method: "query", procedure: "matching.getCandidates", input: params }),
  getCandidate: (candidateId: number, goalId?: number) =>
    callTRPC({ method: "query", procedure: "matching.getCandidate", input: { candidateId, goalId } }),
}

export const favoritesAPI = {
  like: (candidateId: number, goalId?: number) =>
    callTRPC({ method: "mutation", procedure: "favorites.like", input: { candidateId, goalId } }),
  unlike: (candidateId: number, goalId?: number) =>
    callTRPC({ method: "mutation", procedure: "favorites.unlike", input: { candidateId, goalId } }),
  getMyFavorites: (goalId?: number) =>
    callTRPC({ method: "query", procedure: "favorites.getList", input: { goalId } }),
  getAdmirers: (goalId?: number) =>
    callTRPC({ method: "query", procedure: "favorites.getAdmirers", input: { goalId } }),
}

export const adminAPI = {
  getAllUsers: () =>
    callTRPC({ method: "query", procedure: "admin.getAllUsers" }),
  getStats: () =>
    callTRPC({ method: "query", procedure: "admin.getStats" }),
}
