"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import {
  getYandexMetrikaCounterId,
  isYandexMetrikaEnabled,
  yandexMetrikaHit,
} from "@/lib/yandex-metrika"

export default function YandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ""
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const url = search ? `${pathname}?${search}` : pathname
    yandexMetrikaHit(url || "/")
  }, [pathname, search])

  if (!isYandexMetrikaEnabled()) {
    return null
  }

  const counterId = getYandexMetrikaCounterId()

  return (
    <Script id="yandex-metrika-tag" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${counterId}, "init", {
          clickmap:true,
          trackLinks:true,
          accurateTrackBounce:true,
          webvisor:true
        });
      `}
    </Script>
  )
}
