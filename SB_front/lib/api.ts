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
  register: (email: string, password: string, telegramUsername?: string) =>
    callTRPC({ method: "mutation", procedure: "auth.register", input: { email, password, telegramUsername } }),
  login: (email: string, password: string) =>
    callTRPC({ method: "mutation", procedure: "auth.login", input: { email, password } }),
  logout: () =>
    callTRPC({ method: "mutation", procedure: "auth.logout" }),
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
    bio?: string
    experience?: string
    avatarUrl?: string
    university?: string
    program?: string
    course?: string
    messengerHandle?: string
    learningFormat?: string
    communicationStyle?: string
  }) =>
    callTRPC({ method: "mutation", procedure: "profile.updateAboutMe", input: data }),

  updatePartnerPreferences: (data: any) =>
    callTRPC({ method: "mutation", procedure: "profile.updatePartnerPreferences", input: data }),
}

export const goalsAPI = {
  list: () =>
    callTRPC({ method: "query", procedure: "goals.list" }),
  create: (data: { name: string; description?: string; makeActive?: boolean }) =>
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
