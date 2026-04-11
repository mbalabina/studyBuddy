const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

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

export const matchingAPI = {
  getCandidates: (params?: { limit?: number; offset?: number }) =>
    callTRPC({ method: "query", procedure: "matching.getCandidates", input: params }),
  getCandidate: (candidateId: number) =>
    callTRPC({ method: "query", procedure: "matching.getCandidate", input: { candidateId } }),
}

export const favoritesAPI = {
  like: (candidateId: number) =>
    callTRPC({ method: "mutation", procedure: "favorites.like", input: { candidateId } }),
  unlike: (candidateId: number) =>
    callTRPC({ method: "mutation", procedure: "favorites.unlike", input: { candidateId } }),
  getMyFavorites: () =>
    callTRPC({ method: "query", procedure: "favorites.getList" }),
  getAdmirers: () =>
    callTRPC({ method: "query", procedure: "favorites.getAdmirers" }),
}

export const adminAPI = {
  getAllUsers: () =>
    callTRPC({ method: "query", procedure: "admin.getAllUsers" }),
  getStats: () =>
    callTRPC({ method: "query", procedure: "admin.getStats" }),
}
