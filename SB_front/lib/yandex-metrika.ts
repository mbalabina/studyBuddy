const YA_METRIKA_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "")

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
