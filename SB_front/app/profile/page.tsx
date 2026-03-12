"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Camera, X, User, Heart, Settings } from "lucide-react"
import Link from "next/link"

const subjects = [
  "Математика",
  "Физика",
  "Химия",
  "Биология",
  "История",
  "Литература",
  "Английский язык",
  "Информатика",
  "География",
  "Обществознание",
]

const studyGoals = [
  "Подготовка к ЕГЭ",
  "Подготовка к ОГЭ",
  "Изучение нового предмета",
  "Подготовка к олимпиаде",
  "Университетский курс",
  "Повышение оценок",
]

const scheduleOptions = [
  "Утром (6:00-12:00)",
  "Днем (12:00-18:00)",
  "Вечером (18:00-24:00)",
  "Ночью (24:00-6:00)",
  "Выходные",
  "Гибкий график",
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal")
  const [selectedSubjects, setSelectedSubjects] = useState(["Математика", "Физика"])
  const [preferredSubjects, setPreferredSubjects] = useState(["Математика"])
  const [studyIntensity, setStudyIntensity] = useState([3])
  const [maxDistance, setMaxDistance] = useState([10])
  const [minCompatibility, setMinCompatibility] = useState([80])

  const [personalInfo, setPersonalInfo] = useState({
    name: "Анна Петрова",
    age: "17",
    city: "Москва",
    studyGoal: "Подготовка к ЕГЭ",
    level: "Продвинутый",
    schedule: "Вечером (18:00-24:00)",
    bio: "Готовлюсь к ЕГЭ по математике и физике. Люблю решать сложные задачи и объяснять материал другим.",
    experience: "2 года",
    achievements: "Призер олимпиады по математике",
  })

  const [preferences, setPreferences] = useState({
    ageRange: [16, 19],
    preferredLevel: "Любой",
    preferredSchedule: "Вечером (18:00-24:00)",
    studyFormat: "Очно и онлайн",
    groupSize: "Один на один",
    communicationStyle: "Дружелюбный",
    notifications: true,
  })

  const addSubject = (subject: string, type: "personal" | "preferred") => {
    if (type === "personal" && !selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject])
    } else if (type === "preferred" && !preferredSubjects.includes(subject)) {
      setPreferredSubjects([...preferredSubjects, subject])
    }
  }

  const removeSubject = (subject: string, type: "personal" | "preferred") => {
    if (type === "personal") {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject))
    } else {
      setPreferredSubjects(preferredSubjects.filter((s) => s !== subject))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-md mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black">PROFILE</h1>
                <p className="text-xs font-medium text-gray-500 tracking-wider uppercase">Edit Settings</p>
              </div>
            </div>
            <Button className="bg-black hover:bg-gray-800 rounded-full px-6 py-3 font-bold tracking-wide">SAVE</Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 minimal-card border-0 shadow-lg p-2 rounded-full">
            <TabsTrigger
              value="personal"
              className="flex items-center space-x-2 rounded-full font-bold tracking-wide data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <User className="w-4 h-4" />
              <span>ABOUT</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center space-x-2 rounded-full font-bold tracking-wide data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <Heart className="w-4 h-4" />
              <span>MATCH</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center space-x-2 rounded-full font-bold tracking-wide data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4" />
              <span>SETUP</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-huge font-black holographic-text mb-4">ABOUT YOU</h2>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">Tell us about yourself</p>
              </div>
            </div>

            <Card className="minimal-card border-0 shadow-lg holographic-border">
              <CardContent className="p-8 space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-gray-100">
                      <AvatarImage src="/placeholder.svg?key=profile" />
                      <AvatarFallback className="text-2xl font-black">АП</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-black hover:bg-gray-800"
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-lg">PROFILE PHOTO</h3>
                    <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">Add your photo</p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="font-bold tracking-wide uppercase text-sm">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                      className="h-14 rounded-2xl border-2 border-gray-100 font-medium text-lg focus:border-black transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="age" className="font-bold tracking-wide uppercase text-sm">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={personalInfo.age}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })}
                        className="h-14 rounded-2xl border-2 border-gray-100 font-medium text-lg focus:border-black transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="city" className="font-bold tracking-wide uppercase text-sm">
                        City
                      </Label>
                      <Input
                        id="city"
                        value={personalInfo.city}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                        className="h-14 rounded-2xl border-2 border-gray-100 font-medium text-lg focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  {/* Study Goal */}
                  <div className="space-y-3">
                    <Label className="font-bold tracking-wide uppercase text-sm">Study Goal</Label>
                    <Select
                      value={personalInfo.studyGoal}
                      onValueChange={(value) => setPersonalInfo({ ...personalInfo, studyGoal: value })}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-100 font-medium text-lg focus:border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {studyGoals.map((goal) => (
                          <SelectItem key={goal} value={goal} className="font-medium">
                            {goal}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subjects */}
                  <div className="space-y-4">
                    <Label className="font-bold tracking-wide uppercase text-sm">Subjects</Label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {selectedSubjects.map((subject) => (
                        <Badge
                          key={subject}
                          variant="secondary"
                          className="flex items-center space-x-2 rounded-full px-4 py-2 font-bold bg-black text-white"
                        >
                          <span>{subject}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 p-0 hover:bg-transparent text-white"
                            onClick={() => removeSubject(subject, "personal")}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={(value) => addSubject(value, "personal")}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-100 font-medium text-lg focus:border-black">
                        <SelectValue placeholder="Add Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects
                          .filter((s) => !selectedSubjects.includes(s))
                          .map((subject) => (
                            <SelectItem key={subject} value={subject} className="font-medium">
                              {subject}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bio */}
                  <div className="space-y-3">
                    <Label htmlFor="bio" className="font-bold tracking-wide uppercase text-sm">
                      About Me
                    </Label>
                    <Textarea
                      id="bio"
                      value={personalInfo.bio}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                      placeholder="Tell us about your interests, study approach and goals..."
                      rows={4}
                      className="rounded-2xl border-2 border-gray-100 font-medium resize-none focus:border-black transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-huge font-black holographic-text mb-4">FIND MATCH</h2>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">Set your preferences</p>
              </div>
            </div>

            <Card className="minimal-card border-0 shadow-lg holographic-border">
              <CardContent className="p-8 space-y-8">
                {/* Age Range */}
                <div className="space-y-4">
                  <Label className="font-bold tracking-wide uppercase text-sm">
                    Age Range: {preferences.ageRange[0]} - {preferences.ageRange[1]} years
                  </Label>
                  <Slider
                    value={preferences.ageRange}
                    onValueChange={(value) => setPreferences({ ...preferences, ageRange: value })}
                    min={14}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Preferred Subjects */}
                <div className="space-y-4">
                  <Label className="font-bold tracking-wide uppercase text-sm">Study Together</Label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {preferredSubjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant="default"
                        className="flex items-center space-x-2 rounded-full px-4 py-2 font-bold bg-black text-white"
                      >
                        <span>{subject}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-5 h-5 p-0 hover:bg-transparent text-white"
                          onClick={() => removeSubject(subject, "preferred")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addSubject(value, "preferred")}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-100 font-medium text-lg focus:border-black">
                      <SelectValue placeholder="Add Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects
                        .filter((s) => !preferredSubjects.includes(s))
                        .map((subject) => (
                          <SelectItem key={subject} value={subject} className="font-medium">
                            {subject}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance and Compatibility */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="font-bold tracking-wide uppercase text-sm">
                      Max Distance: {maxDistance[0]} km
                    </Label>
                    <Slider
                      value={maxDistance}
                      onValueChange={setMaxDistance}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="font-bold tracking-wide uppercase text-sm">
                      Min Compatibility: {minCompatibility[0]}%
                    </Label>
                    <Slider
                      value={minCompatibility}
                      onValueChange={setMinCompatibility}
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-huge font-black holographic-text mb-4">SETTINGS</h2>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">App preferences</p>
              </div>
            </div>

            <Card className="minimal-card border-0 shadow-lg holographic-border">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-lg">NOTIFICATIONS</h4>
                    <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">New matches alerts</p>
                  </div>
                  <Switch
                    checked={preferences.notifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-lg">ONLINE STATUS</h4>
                    <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">Show when online</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-lg">AUTO MATCH</h4>
                    <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">Smart suggestions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <Button variant="destructive" className="w-full rounded-full h-14 font-bold tracking-wide">
                    DELETE ACCOUNT
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
