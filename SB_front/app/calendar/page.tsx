"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Plus, CalendarIcon, Clock, MapPin, Video, TrendingUp, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock data for calendar events
const mockEvents = [
  {
    id: 1,
    title: "Изучение интегралов",
    partner: "Михаил Иванов",
    partnerAvatar: "/student-boy.png",
    subject: "Математика",
    date: "2024-01-15",
    time: "18:00",
    duration: 90,
    type: "online",
    status: "upcoming",
    description: "Разбор сложных интегралов и методов их решения",
  },
  {
    id: 2,
    title: "Подготовка к контрольной",
    partner: "Елена Смирнова",
    partnerAvatar: "/placeholder-7o1no.png",
    subject: "Физика",
    date: "2024-01-16",
    time: "16:00",
    duration: 120,
    type: "offline",
    location: "Библиотека им. Ленина",
    status: "upcoming",
    description: "Повторение материала по механике",
  },
  {
    id: 3,
    title: "Решение задач ЕГЭ",
    partner: "Михаил Иванов",
    partnerAvatar: "/student-boy.png",
    subject: "Математика",
    date: "2024-01-12",
    time: "18:00",
    duration: 90,
    type: "online",
    status: "completed",
    description: "Разбор задач части C",
    rating: 5,
    feedback: "Отличное занятие! Разобрали много сложных задач.",
  },
]

const mockStudyStats = {
  totalHours: 45,
  completedSessions: 12,
  upcomingSessions: 3,
  averageRating: 4.8,
  studyStreak: 7,
  favoriteSubject: "Математика",
  weeklyGoal: 10,
  weeklyProgress: 7,
}

const mockPartners = [
  { id: 2, name: "Михаил Иванов", avatar: "/student-boy.png" },
  { id: 3, name: "Елена Смирнова", avatar: "/placeholder-7o1no.png" },
  { id: 4, name: "Дмитрий Козлов", avatar: "/placeholder-5wpiq.png" },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState("2024-01-15")
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")
  const [newEvent, setNewEvent] = useState({
    title: "",
    partner: "",
    subject: "",
    date: "",
    time: "",
    duration: 60,
    type: "online",
    location: "",
    description: "",
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleCreateEvent = () => {
    // Here you would typically save the event
    console.log("Creating event:", newEvent)
    setShowNewEventDialog(false)
    setNewEvent({
      title: "",
      partner: "",
      subject: "",
      date: "",
      time: "",
      duration: 60,
      type: "online",
      location: "",
      description: "",
    })
  }

  const upcomingEvents = mockEvents.filter((event) => event.status === "upcoming")
  const completedEvents = mockEvents.filter((event) => event.status === "completed")

  return (
    <div className="min-h-screen bg-white">
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
                <h1 className="text-2xl font-black">CALENDAR</h1>
                <p className="text-xs font-medium text-gray-500 tracking-wider uppercase">Study Planning</p>
              </div>
            </div>
            <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 rounded-full px-6 py-3 font-bold tracking-wide">
                  <Plus className="w-5 h-5 mr-2" />
                  NEW SESSION
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md minimal-card border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">SCHEDULE SESSION</DialogTitle>
                  <DialogDescription className="font-medium text-gray-500 tracking-wide uppercase text-sm">
                    Create new study session
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="font-bold tracking-wide uppercase text-sm">
                      Session Title
                    </Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Calculus Study Session"
                      className="h-12 rounded-2xl border-2 border-gray-100 font-medium focus:border-black transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold tracking-wide uppercase text-sm">Partner</Label>
                    <Select
                      value={newEvent.partner}
                      onValueChange={(value) => setNewEvent({ ...newEvent, partner: value })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-2 border-gray-100 font-medium focus:border-black">
                        <SelectValue placeholder="Choose partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPartners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.name} className="font-medium">
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="date" className="font-bold tracking-wide uppercase text-sm">
                        Date
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="h-12 rounded-2xl border-2 border-gray-100 font-medium focus:border-black transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="time" className="font-bold tracking-wide uppercase text-sm">
                        Time
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="h-12 rounded-2xl border-2 border-gray-100 font-medium focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="font-bold tracking-wide uppercase text-sm">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="What will you study..."
                      rows={3}
                      className="rounded-2xl border-2 border-gray-100 font-medium resize-none focus:border-black transition-colors"
                    />
                  </div>

                  <Button
                    onClick={handleCreateEvent}
                    className="w-full bg-black hover:bg-gray-800 rounded-full h-12 font-bold tracking-wide"
                  >
                    CREATE SESSION
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 minimal-card border-0 shadow-lg p-2 rounded-full">
            <TabsTrigger
              value="calendar"
              className="flex items-center space-x-2 rounded-full font-bold tracking-wide data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>SCHEDULE</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center space-x-2 rounded-full font-bold tracking-wide data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              <span>STATS</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center space-x-2 rounded-full font-bold tracking-wide data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <Award className="w-4 h-4" />
              <span>REPORTS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <CalendarIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-huge font-black holographic-text mb-4">STUDY PLAN</h2>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">Manage your sessions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upcoming Events */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="minimal-card border-0 shadow-lg holographic-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-black">UPCOMING SESSIONS</CardTitle>
                    <CardDescription className="font-medium text-gray-500 tracking-wide uppercase text-sm">
                      Your scheduled study sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-6 border-2 border-gray-100 rounded-2xl hover:border-black transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="w-12 h-12 border-2 border-gray-100">
                              <AvatarImage src={event.partnerAvatar || "/placeholder.svg"} />
                              <AvatarFallback className="font-bold">
                                {event.partner
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-black text-lg">{event.title}</h3>
                              <p className="font-medium text-gray-600">with {event.partner}</p>
                              <div className="flex items-center space-x-6 mt-3 text-sm font-bold text-gray-500 tracking-wide uppercase">
                                <div className="flex items-center space-x-2">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>{new Date(event.date).toLocaleDateString("ru-RU")}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {event.time} ({event.duration} min)
                                  </span>
                                </div>
                                {event.type === "online" ? (
                                  <div className="flex items-center space-x-2">
                                    <Video className="w-4 h-4" />
                                    <span>Online</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                              <p className="font-medium text-gray-600 mt-3">{event.description}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="rounded-full px-4 py-2 font-bold bg-black text-white">
                            {event.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end space-x-3 mt-6">
                          <Button
                            variant="outline"
                            className="rounded-full px-6 py-2 border-2 border-gray-200 hover:border-black font-bold tracking-wide bg-transparent"
                          >
                            EDIT
                          </Button>
                          <Button className="bg-black hover:bg-gray-800 rounded-full px-6 py-2 font-bold tracking-wide">
                            JOIN
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats Sidebar */}
              <div className="space-y-6">
                <Card className="minimal-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-center">QUICK STATS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-black">{mockStudyStats.totalHours}</div>
                        <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black">{mockStudyStats.completedSessions}</div>
                        <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black">{mockStudyStats.studyStreak}</div>
                        <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black">{mockStudyStats.averageRating}</div>
                        <div className="text-xs font-bold text-gray-500 tracking-wider uppercase">Rating</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="minimal-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-black">WEEKLY GOAL</CardTitle>
                    <CardDescription className="font-medium text-gray-500 tracking-wide uppercase text-sm">
                      Study hours progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-bold">
                        <span>
                          {mockStudyStats.weeklyProgress} of {mockStudyStats.weeklyGoal} hours
                        </span>
                        <span>{Math.round((mockStudyStats.weeklyProgress / mockStudyStats.weeklyGoal) * 100)}%</span>
                      </div>
                      <Progress
                        value={(mockStudyStats.weeklyProgress / mockStudyStats.weeklyGoal) * 100}
                        className="h-3 rounded-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-huge font-black holographic-text mb-4">STATISTICS</h2>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">Your study analytics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="minimal-card border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black mb-3">{mockStudyStats.totalHours}</div>
                  <div className="text-sm font-bold text-gray-500 tracking-wider uppercase">Total Hours</div>
                </CardContent>
              </Card>
              <Card className="minimal-card border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black mb-3">{mockStudyStats.completedSessions}</div>
                  <div className="text-sm font-bold text-gray-500 tracking-wider uppercase">Sessions</div>
                </CardContent>
              </Card>
              <Card className="minimal-card border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black mb-3">{mockStudyStats.studyStreak}</div>
                  <div className="text-sm font-bold text-gray-500 tracking-wider uppercase">Day Streak</div>
                </CardContent>
              </Card>
              <Card className="minimal-card border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black mb-3">{mockStudyStats.averageRating}</div>
                  <div className="text-sm font-bold text-gray-500 tracking-wider uppercase">Avg Rating</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-huge font-black holographic-text mb-4">REPORTS</h2>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">Progress analysis</p>
              </div>
            </div>

            <Card className="minimal-card border-0 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 mx-auto mb-8 relative opacity-30">
                  <Image src="/mascot.png" alt="Study Buddy Mascot" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-black mb-4">REPORTS COMING SOON</h3>
                <p className="text-gray-500 font-medium mb-8 tracking-wide uppercase text-sm">
                  Available after first month
                </p>
                <Button
                  variant="outline"
                  className="rounded-full px-8 py-3 border-2 border-gray-200 hover:border-black font-bold tracking-wide bg-transparent"
                >
                  LEARN MORE
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
