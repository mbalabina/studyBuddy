/**
 * API Client для Study Buddy Backend
 * Все запросы идут на http://localhost:3001/api/trpc/
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface TRPCRequest {
  method: "query" | "mutation";
  procedure: string;
  input?: any;
}

async function callTRPC(req: TRPCRequest) {
  const { method, procedure, input } = req;
  
  // Формируем URL в зависимости от типа запроса
  let url = `${API_URL}/api/trpc/${procedure}`;
  
  if (method === "query" && input) {
    url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
  }

  const options: RequestInit = {
    method: method === "query" ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Для отправки cookies
  };

  if (method === "mutation" && input) {
    options.body = JSON.stringify(input);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.result?.data;
}

// ========== AUTH ENDPOINTS ==========
export const authAPI = {
  register: async (email: string, password: string, telegramUsername: string) => {
    return callTRPC({
      method: "mutation",
      procedure: "auth.register",
      input: { email, password, telegramUsername },
    });
  },

  login: async (email: string, password: string) => {
    return callTRPC({
      method: "mutation",
      procedure: "auth.login",
      input: { email, password },
    });
  },

  getMe: async () => {
    return callTRPC({
      method: "query",
      procedure: "auth.me",
    });
  },
};

// ========== PROFILE ENDPOINTS ==========
export const profileAPI = {
  getMyProfile: async () => {
    return callTRPC({
      method: "query",
      procedure: "profiles.getMyProfile",
    });
  },

  updateAboutMe: async (data: any) => {
    return callTRPC({
      method: "mutation",
      procedure: "profiles.updateAboutMe",
      input: data,
    });
  },

  updatePartnerPreferences: async (data: any) => {
    return callTRPC({
      method: "mutation",
      procedure: "profiles.updatePartnerPreferences",
      input: data,
    });
  },
};

// ========== DISCOVER ENDPOINTS ==========
export const discoverAPI = {
  getCandidates: async (goalId?: string) => {
    return callTRPC({
      method: "query",
      procedure: "discover.getCandidates",
      input: goalId ? { goalId } : undefined,
    });
  },

  getCandidate: async (candidateId: number) => {
    return callTRPC({
      method: "query",
      procedure: "discover.getCandidate",
      input: { candidateId },
    });
  },
};

// ========== FAVORITES ENDPOINTS ==========
export const favoritesAPI = {
  like: async (candidateId: number, goalId: string) => {
    return callTRPC({
      method: "mutation",
      procedure: "favorites.like",
      input: { candidateId, goalId },
    });
  },

  unlike: async (candidateId: number, goalId: string) => {
    return callTRPC({
      method: "mutation",
      procedure: "favorites.unlike",
      input: { candidateId, goalId },
    });
  },

  getMyFavorites: async (goalId?: string) => {
    return callTRPC({
      method: "query",
      procedure: "favorites.getMyFavorites",
      input: goalId ? { goalId } : undefined,
    });
  },

  getAdmirers: async (goalId?: string) => {
    return callTRPC({
      method: "query",
      procedure: "favorites.getAdmirers",
      input: goalId ? { goalId } : undefined,
    });
  },
};

// ========== ADMIN ENDPOINTS ==========
export const adminAPI = {
  getAllUsers: async () => {
    return callTRPC({
      method: "query",
      procedure: "admin.getAllUsers",
    });
  },

  getStats: async () => {
    return callTRPC({
      method: "query",
      procedure: "admin.getStats",
    });
  },
};
