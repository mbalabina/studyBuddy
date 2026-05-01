const YA_METRIKA_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "")

// Yandex Metrika Goals
export const YA_GOALS = {
  REGISTRATION_COMPLETE: "registration_complete",
  SURVEY1_COMPLETE: "survey1_complete",
  SURVEY2_COMPLETE: "survey2_complete",
  FIRST_MATCH: "first_match",
  CARD_LIKE: "card_like",
  CARD_VIEW: "card_view",
  CONTACT_EXCHANGE: "contact_exchange",
  SESSION_RETURN: "session_return",
} as const

export function isYandexMetrikaEnabled(): boolean {
  return Number.isFinite(YA_METRIKA_COUNTER_ID) && YA_METRIKA_COUNTER_ID > 0
}

export function getYandexMetrikaCounterId(): number {
  return YA_METRIKA_COUNTER_ID
}

export function yandexMetrikaHit(url: string, options?: Record<string, unknown>) {
  if (!isYandexMetrikaEnabled()) return
  if (typeof window === "undefined") return

  const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym
  if (typeof ym !== "function") return

  ym(YA_METRIKA_COUNTER_ID, "hit", url, options ?? {})
}

// Goal tracking function
export function trackYandexGoal(goalId: string, params?: Record<string, unknown>) {
  if (!isYandexMetrikaEnabled()) return
  if (typeof window === "undefined") return

  const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym
  if (typeof ym !== "function") return

  if (params && Object.keys(params).length > 0) {
    ym(YA_METRIKA_COUNTER_ID, "reachGoal", goalId, params)
  } else {
    ym(YA_METRIKA_COUNTER_ID, "reachGoal", goalId)
  }
}

// Specific goal tracking functions
export function trackRegistrationComplete() {
  trackYandexGoal(YA_GOALS.REGISTRATION_COMPLETE)
}

export function trackSurvey1Complete() {
  trackYandexGoal(YA_GOALS.SURVEY1_COMPLETE)
}

export function trackSurvey2Complete() {
  trackYandexGoal(YA_GOALS.SURVEY2_COMPLETE)
}

<<<<<<< HEAD
=======
export function trackAnketaRated() {
  trackYandexGoal(YA_GOALS.ANKETA_RATED)
}

>>>>>>> 728f6d26dfb05080b19e8ff465e626d750fbe1b8
export function trackFirstMatch() {
  trackYandexGoal(YA_GOALS.FIRST_MATCH)
}

export function trackCardLike() {
  trackYandexGoal(YA_GOALS.CARD_LIKE)
}

export function trackCardView() {
  trackYandexGoal(YA_GOALS.CARD_VIEW)
}

export function trackContactExchange() {
  trackYandexGoal(YA_GOALS.CONTACT_EXCHANGE)
}

<<<<<<< HEAD
=======
export function trackAppRated() {
  trackYandexGoal(YA_GOALS.APP_RATED)
}

>>>>>>> 728f6d26dfb05080b19e8ff465e626d750fbe1b8
export function trackSessionReturn() {
  trackYandexGoal(YA_GOALS.SESSION_RETURN)
}
