"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Filter, RotateCcw } from "lucide-react"

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

const scheduleOptions = [
  "Утром (6:00-12:00)",
  "Днем (12:00-18:00)",
  "Вечером (18:00-24:00)",
  "Ночью (24:00-6:00)",
  "Выходные",
  "Гибкий график",
]

interface PartnerFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: any) => void
}

export default function PartnerFilters({ isOpen, onClose, onApplyFilters }: PartnerFiltersProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [ageRange, setAgeRange] = useState([16, 20])
  const [maxDistance, setMaxDistance] = useState([10])
  const [minCompatibility, setMinCompatibility] = useState([70])
  const [level, setLevel] = useState("any")
  const [schedule, setSchedule] = useState("any")
  const [studyFormat, setStudyFormat] = useState("any")
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [hasReviews, setHasReviews] = useState(false)

  const addSubject = (subject: string) => {
    if (!selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject])
    }
  }

  const removeSubject = (subject: string) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s !== subject))
  }

  const resetFilters = () => {
    setSelectedSubjects([])
    setAgeRange([16, 20])
    setMaxDistance([10])
    setMinCompatibility([70])
    setLevel("any")
    setSchedule("any")
    setStudyFormat("any")
    setOnlineOnly(false)
    setHasReviews(false)
  }

  const applyFilters = () => {
    const filters = {
      subjects: selectedSubjects,
      ageRange,
      maxDistance: maxDistance[0],
      minCompatibility: minCompatibility[0],
      level,
      schedule,
      studyFormat,
      onlineOnly,
      hasReviews,
    }
    onApplyFilters(filters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Фильтры поиска</span>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subjects */}
          <div className="space-y-3">
            <Label>Предметы</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSubjects.map((subject) => (
                <Badge key={subject} variant="default" className="flex items-center space-x-1">
                  <span>{subject}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-4 h-4 p-0 hover:bg-transparent text-white"
                    onClick={() => removeSubject(subject)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Добавить предмет" />
              </SelectTrigger>
              <SelectContent>
                {subjects
                  .filter((s) => !selectedSubjects.includes(s))
                  .map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label>
              Возраст: {ageRange[0]} - {ageRange[1]} лет
            </Label>
            <Slider value={ageRange} onValueChange={setAgeRange} min={14} max={25} step={1} className="w-full" />
          </div>

          {/* Distance */}
          <div className="space-y-3">
            <Label>Максимальное расстояние: {maxDistance[0]} км</Label>
            <Slider value={maxDistance} onValueChange={setMaxDistance} min={1} max={50} step={1} className="w-full" />
          </div>

          {/* Compatibility */}
          <div className="space-y-3">
            <Label>Минимальная совместимость: {minCompatibility[0]}%</Label>
            <Slider
              value={minCompatibility}
              onValueChange={setMinCompatibility}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Level and Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Уровень подготовки</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любой</SelectItem>
                  <SelectItem value="Начинающий">Начинающий</SelectItem>
                  <SelectItem value="Средний">Средний</SelectItem>
                  <SelectItem value="Продвинутый">Продвинутый</SelectItem>
                  <SelectItem value="Эксперт">Эксперт</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Время занятий</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любое время</SelectItem>
                  {scheduleOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Study Format */}
          <div className="space-y-2">
            <Label>Формат обучения</Label>
            <Select value={studyFormat} onValueChange={setStudyFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Любой</SelectItem>
                <SelectItem value="Очно">Только очно</SelectItem>
                <SelectItem value="Онлайн">Только онлайн</SelectItem>
                <SelectItem value="Очно и онлайн">Очно и онлайн</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Только онлайн партнеры</Label>
                <p className="text-sm text-gray-500">Показывать только тех, кто готов заниматься онлайн</p>
              </div>
              <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Только с отзывами</Label>
                <p className="text-sm text-gray-500">Показывать только партнеров с положительными отзывами</p>
              </div>
              <Switch checked={hasReviews} onCheckedChange={setHasReviews} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={resetFilters} className="flex-1 bg-transparent">
              <RotateCcw className="w-4 h-4 mr-2" />
              Сбросить
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600">
              Применить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
