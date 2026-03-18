"use client"

import { AppProvider, useApp } from "@/lib/app-context"
import SplashScreen from "@/components/screens/splash-screen"
import AuthScreen from "@/components/screens/auth-screen"
import AboutYouScreen from "@/components/screens/about-you-screen"
import Survey1Screen from "@/components/screens/survey1-screen"
import Survey2Screen from "@/components/screens/survey2-screen"
import HomeScreen from "@/components/screens/home-screen"
import SearchIntroScreen, {
  CandidateCardScreen,
  CandidateDetailScreen,
  MatchWaitingScreen,
  MatchSuccessScreen,
  LikesScreen,
  LikesCandidatesScreen,
} from "@/components/screens/search-screens"

function AppContent() {
  const { state } = useApp()

  switch (state.screen) {
    case "splash":
      return <SplashScreen />
    case "auth":
    case "auth-code":
      return <AuthScreen />
    case "about-step1":
    case "about-step2":
    case "about-step3":
    case "about-congrats":
    case "about-goal":
    case "new-goal":        // ← добавь эту строку
    case "about-congrats2":
  return <AboutYouScreen />

      return <AboutYouScreen />
    case "survey1":
      return <Survey1Screen />
    case "survey2":
      return <Survey2Screen />
    case "main":
      return <HomeScreen />
    case "search-intro":
      return <SearchIntroScreen />
    case "search-card":
      return <CandidateCardScreen />
    case "search-profile":
      return <CandidateDetailScreen />
    case "match-waiting":
      return <MatchWaitingScreen />
    case "match-success":
    case "match-contacts":
      return <MatchSuccessScreen />
    case "likes":
      return <LikesScreen />
    case "likes-candidates":
      return <LikesCandidatesScreen />
    default:
      return <SplashScreen />
  }
}

export default function Page() {
  return (
    <AppProvider>
      <div className="mx-auto max-w-[430px] min-h-dvh bg-white relative overflow-hidden shadow-2xl">
        <AppContent />
      </div>
    </AppProvider>
  )
}
