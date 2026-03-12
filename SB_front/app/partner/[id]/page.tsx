"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Heart, MessageCircle, Star, MapPin, Clock, TrendingUp, Award, Users, Calendar } from "lucide-react"
import Link from "next/link"

// Mock detailed partner data
const partnerData = {
  id: 2,
  name: "Михаил Иванов",
  avatar: "/student-boy.png",
  age: 17,
  city: "Москва",
  studyGoal: "Подготовка к ЕГЭ по математике и информатике",
  level: "Продвинутый",
  subjects: ["Математика", "Информатика", "Физика"],
  schedule: "Вечером (18:00-22:00)",
  compatibility: 95,
  distance: "2 км",
  rating: 4.8,
  studyHours: 120,
  isLiked: false,
  bio: "Увлекаюсь программированием и математикой. Готовлюсь к поступлению в МФТИ. Люблю объяснять сложные темы простыми словами и решать нестандартные задачи. Ищу мотивированного партнера для взаимной подготовки.",
  achievements: ["Призер олимпиады по информатике", "Сертификат Python Developer", "95+ баллов по пробному ЕГЭ"],
  experience: "3 года программирования",
  studyFormat: "Очно и онлайн",
  groupPreference: "Один на один",
  responseTime: "~2 часа",
  lastActive: "Онлайн",
  studyStats: {
    completedSessions: 45,
    averageRating: 4.8,
    helpedStudents: 12,
    studyStreak: 15,
  },
  compatibilityBreakdown: {
    subjects: 95,
    schedule: 90,
    level: 100,
    goals: 85,
    location: 95,
  },
  reviews: [
    {
      id: 1,
      author: "Анна К.",
      rating: 5,
      text: "Отличный партнер! Очень терпеливо объясняет сложные темы по математике.",
      date: "2 недели назад",
    },
    {
      id: 2,
      author: "Дмитрий С.",
      rating: 5,
      text: "Помог подготовиться к олимпиаде. Рекомендую!",
      date: "1 месяц назад",
    },
  ],
}

export default function PartnerProfilePage() {
  const [isLiked, setIsLiked] = useState(partnerData.isLiked)

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "bg-black text-white"
    if (score >= 80) return "bg-gray-800 text-white"
    if (score >= 70) return "bg-gray-600 text-white"
    return "bg-gray-400 text-white"
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black">PARTNER</h1>
                <p className="text-xs font-medium text-gray-500 tracking-wider uppercase">Profile Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={`rounded-full border-2 ${
                  isLiked
                    ? "text-red-500 border-red-200 bg-red-50"
                    : "border-gray-200 hover:border-black bg-transparent"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <Button className="bg-black hover:bg-gray-800 rounded-full px-6 py-3 font-bold tracking-wide">
                <MessageCircle className="w-5 h-5 mr-2" />
                MESSAGE
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <Card className="minimal-card border-0 shadow-lg holographic-border">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6 mb-8">
                  <Avatar className="w-24 h-24 border-4 border-gray-100">
                    <AvatarImage src={partnerData.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl font-black">МИ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-3xl font-black">{partnerData.name}</h2>
                        <p className="font-medium text-gray-600 tracking-wide uppercase text-sm">
                          {partnerData.age} years • {partnerData.city}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-2">
                            <Star className="w-5 h-5 fill-black" />
                            <span className="font-black text-lg">{partnerData.rating}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="font-bold text-gray-600">{partnerData.distance}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="font-black text-green-600">{partnerData.lastActive}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-lg mb-3 tracking-wide uppercase">Study Goal</h3>
                    <p className="font-medium text-gray-700">{partnerData.studyGoal}</p>
                  </div>

                  <div>
                    <h3 className="font-black text-lg mb-3 tracking-wide uppercase">About</h3>
                    <p className="font-medium text-gray-700">{partnerData.bio}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-black mb-3 tracking-wide uppercase">Subjects</h4>
                      <div className="flex flex-wrap gap-2">
                        {partnerData.subjects.map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="rounded-full px-4 py-2 font-bold bg-black text-white"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black mb-3 tracking-wide uppercase">Level</h4>
                      <Badge
                        variant="outline"
                        className="rounded-full px-4 py-2 font-bold bg-gray-100 text-black border-2 border-gray-200"
                      >
                        {partnerData.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-6 h-6" />
                      <div>
                        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">Schedule</p>
                        <p className="font-black">{partnerData.schedule}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-6 h-6" />
                      <div>
                        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">Study Hours</p>
                        <p className="font-black">{partnerData.studyHours}h</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="w-6 h-6" />
                      <div>
                        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">Response Time</p>
                        <p className="font-black">{partnerData.responseTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="minimal-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl font-black">
                  <Award className="w-6 h-6" />
                  <span>ACHIEVEMENTS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnerData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                      <span className="font-medium text-gray-700">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="minimal-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-black">REVIEWS</CardTitle>
                <CardDescription className="font-medium text-gray-500 tracking-wide uppercase text-sm">
                  What other students say
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {partnerData.reviews.map((review) => (
                  <div key={review.id} className="border-l-4 border-black pl-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-black">{review.author}</span>
                        <div className="flex items-center">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-black" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">{review.date}</span>
                    </div>
                    <p className="font-medium text-gray-700">{review.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Compatibility */}
            <Card className="minimal-card border-0 shadow-lg holographic-border">
              <CardHeader>
                <CardTitle className="text-center">
                  <div
                    className={`inline-flex items-center px-6 py-4 rounded-full text-2xl font-black ${getCompatibilityColor(partnerData.compatibility)}`}
                  >
                    {partnerData.compatibility}% MATCH
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-600 tracking-wide uppercase text-sm">Subjects</span>
                    <span className="font-black">{partnerData.compatibilityBreakdown.subjects}%</span>
                  </div>
                  <Progress value={partnerData.compatibilityBreakdown.subjects} className="h-3 rounded-full" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-600 tracking-wide uppercase text-sm">Schedule</span>
                    <span className="font-black">{partnerData.compatibilityBreakdown.schedule}%</span>
                  </div>
                  <Progress value={partnerData.compatibilityBreakdown.schedule} className="h-3 rounded-full" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-600 tracking-wide uppercase text-sm">Level</span>
                    <span className="font-black">{partnerData.compatibilityBreakdown.level}%</span>
                  </div>
                  <Progress value={partnerData.compatibilityBreakdown.level} className="h-3 rounded-full" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-600 tracking-wide uppercase text-sm">Goals</span>
                    <span className="font-black">{partnerData.compatibilityBreakdown.goals}%</span>
                  </div>
                  <Progress value={partnerData.compatibilityBreakdown.goals} className="h-3 rounded-full" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-600 tracking-wide uppercase text-sm">Location</span>
                    <span className="font-black">{partnerData.compatibilityBreakdown.location}%</span>
                  </div>
                  <Progress value={partnerData.compatibilityBreakdown.location} className="h-3 rounded-full" />
                </div>
              </CardContent>
            </Card>

            {/* Study Stats */}
            <Card className="minimal-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-black text-center">STATISTICS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black">{partnerData.studyStats.completedSessions}</div>
                    <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black">{partnerData.studyStats.helpedStudents}</div>
                    <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Helped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black">{partnerData.studyStats.studyStreak}</div>
                    <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black">{partnerData.studyStats.averageRating}</div>
                    <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="minimal-card border-0 shadow-lg">
              <CardContent className="pt-8 space-y-4">
                <Button className="w-full bg-black hover:bg-gray-800 rounded-full h-12 font-bold tracking-wide">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  START CHAT
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full h-12 border-2 border-gray-200 hover:border-black font-bold tracking-wide bg-transparent"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  SCHEDULE SESSION
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full h-12 border-2 border-gray-200 hover:border-black font-bold tracking-wide bg-transparent"
                >
                  <Users className="w-5 h-5 mr-2" />
                  INVITE TO GROUP
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
