const YA_METRIKA_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "")

export const YA_GOALS = {
  REGISTRATION_COMPLETE: "registration_complete",
  SURVEY1_COMPLETE: "survey1_complete",
  SURVEY2_COMPLETE: "survey2_complete",
  FIRST_MATCH: "first_match",
  MATCH_CREATED: "match_created",
  CARD_LIKE: "card_like",
  CARD_VIEW: "card_view",
  CONTACT_EXCHANGE: "contact_exchange",
  SESSION_RETURN: "session_return",
} as const

type YmFn = (...args: unknown[]) => void

type YmCommand =
  | { method: "hit"; url: string; options: Record<string, unknown> }
  | { method: "reachGoal"; goalId: string; params: Record<string, unknown> }

const YM_RETRY_INTERVAL_MS = 500
const YM_MAX_RETRY_ATTEMPTS = 20
const YM_QUEUE_LIMIT = 50

let ymQueue: YmCommand[] = []
let ymFlushTimer: number | null = null

export function isYandexMetrikaEnabled(): boolean {
  return Number.isFinite(YA_METRIKA_COUNTER_ID) && YA_METRIKA_COUNTER_ID > 0
}

export function getYandexMetrikaCounterId(): number {
  return YA_METRIKA_COUNTER_ID
}

function getYmFunction(): YmFn | null {
  if (typeof window === "undefined") return null
  const ym = (window as Window & { ym?: YmFn }).ym
  return typeof ym === "function" ? ym : null
}

function executeYmCommand(ym: YmFn, command: YmCommand) {
  if (command.method === "hit") {
    ym(YA_METRIKA_COUNTER_ID, "hit", command.url, command.options)
    return
  }

  ym(YA_METRIKA_COUNTER_ID, "reachGoal", command.goalId, command.params)
}

function flushYmQueueIfPossible(): boolean {
  const ym = getYmFunction()
  if (!ym) return false

  while (ymQueue.length > 0) {
    const command = ymQueue.shift()
    if (!command) continue
    executeYmCommand(ym, command)
  }

  return true
}

function stopYmFlushTimer() {
  if (typeof window === "undefined") return
  if (ymFlushTimer === null) return
  window.clearInterval(ymFlushTimer)
  ymFlushTimer = null
}

function startYmFlushTimer() {
  if (typeof window === "undefined") return
  if (ymFlushTimer !== null) return

  let attempts = 0
  ymFlushTimer = window.setInterval(() => {
    attempts += 1
    const flushed = flushYmQueueIfPossible()
    if (flushed || attempts >= YM_MAX_RETRY_ATTEMPTS) {
      stopYmFlushTimer()
      if (!flushed) {
        ymQueue = []
      }
    }
  }, YM_RETRY_INTERVAL_MS)
}

function dispatchYmCommand(command: YmCommand) {
  if (!isYandexMetrikaEnabled()) return
  if (typeof window === "undefined") return

  const ym = getYmFunction()
  if (ym) {
    executeYmCommand(ym, command)
    return
  }

  ymQueue.push(command)
  if (ymQueue.length > YM_QUEUE_LIMIT) {
    ymQueue = ymQueue.slice(-YM_QUEUE_LIMIT)
  }
  startYmFlushTimer()
}

export function yandexMetrikaHit(url: string, options?: Record<string, unknown>) {
  dispatchYmCommand({
    method: "hit",
    url,
    options: options ?? {},
  })
}

export function trackYandexGoal(goalId: string, params?: Record<string, unknown>) {
  dispatchYmCommand({
    method: "reachGoal",
    goalId,
    params: {
      event_id: goalId,
      ...params,
    },
  })
}

export function trackRegistrationComplete() { trackYandexGoal(YA_GOALS.REGISTRATION_COMPLETE) }
export function trackSurvey1Complete()       { trackYandexGoal(YA_GOALS.SURVEY1_COMPLETE) }
export function trackSurvey2Complete()       { trackYandexGoal(YA_GOALS.SURVEY2_COMPLETE) }
export function trackFirstMatch()            { trackYandexGoal(YA_GOALS.FIRST_MATCH) }
export function trackMatchCreated()          { trackYandexGoal(YA_GOALS.MATCH_CREATED) }
export function trackCardLike()              { trackYandexGoal(YA_GOALS.CARD_LIKE) }
export function trackCardView()              { trackYandexGoal(YA_GOALS.CARD_VIEW) }
export function trackContactExchange()       { trackYandexGoal(YA_GOALS.CONTACT_EXCHANGE) }
export function trackSessionReturn()         { trackYandexGoal(YA_GOALS.SESSION_RETURN) }
