"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Calendar,
  Search,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

// Mock chat data
const mockChats = [
  {
    id: 1,
    partnerId: 2,
    partnerName: "Михаил Иванов",
    partnerAvatar: "/student-boy.png",
    lastMessage: "Привет! Готов к завтрашнему занятию по математике?",
    lastMessageTime: "14:30",
    unreadCount: 2,
    isOnline: true,
    subject: "Математика",
  },
  {
    id: 2,
    partnerId: 3,
    partnerName: "Елена Смирнова",
    partnerAvatar: "/placeholder-7o1no.png",
    lastMessage: "Спасибо за объяснение интегралов! Теперь понятно",
    lastMessageTime: "Вчера",
    unreadCount: 0,
    isOnline: false,
    subject: "Математика",
  },
  {
    id: 3,
    partnerId: 4,
    partnerName: "Дмитрий Козлов",
    partnerAvatar: "/placeholder-5wpiq.png",
    lastMessage: "Можем встретиться в библиотеке завтра в 16:00?",
    lastMessageTime: "2 дня назад",
    unreadCount: 1,
    isOnline: false,
    subject: "Физика",
  },
]

const mockMessages = [
  {
    id: 1,
    senderId: 2,
    senderName: "Михаил Иванов",
    text: "Привет! Как дела с подготовкой к ЕГЭ?",
    timestamp: "13:45",
    isOwn: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: "Анна Петрова",
    text: "Привет! Все хорошо, но есть проблемы с интегралами",
    timestamp: "13:47",
    isOwn: true,
  },
  {
    id: 3,
    senderId: 2,
    senderName: "Михаил Иванов",
    text: "Понятно! Интегралы действительно сложная тема. Хочешь, разберем их завтра?",
    timestamp: "13:48",
    isOwn: false,
  },
  {
    id: 4,
    senderId: 1,
    senderName: "Анна Петрова",
    text: "Да, было бы здорово! В какое время тебе удобно?",
    timestamp: "13:50",
    isOwn: true,
  },
  {
    id: 5,
    senderId: 2,
    senderName: "Михаил Иванов",
    text: "Как насчет 18:00? Можем встретиться в библиотеке или онлайн",
    timestamp: "13:52",
    isOwn: false,
  },
  {
    id: 6,
    senderId: 1,
    senderName: "Анна Петрова",
    text: "Отлично! Давай онлайн, так будет удобнее",
    timestamp: "13:55",
    isOwn: true,
  },
  {
    id: 7,
    senderId: 2,
    senderName: "Михаил Иванов",
    text: "Готов к завтрашнему занятию по математике? Я подготовил несколько примеров по интегралам",
    timestamp: "14:30",
    isOwn: false,
  },
]

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0])
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        senderId: 1,
        senderName: "Анна Петрова",
        text: newMessage,
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredChats = mockChats.filter(
    (chat) =>
      chat.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
                <h1 className="text-2xl font-black">MESSAGES</h1>
                <p className="text-xs font-medium text-gray-500 tracking-wider uppercase">Study Partners</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="minimal-card border-0 shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-black rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">CHATS</CardTitle>
                  <p className="text-xs font-medium text-gray-500 tracking-wider uppercase">Active conversations</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search chats..."
                  className="pl-12 h-12 rounded-full border-2 border-gray-100 font-medium focus:border-black transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 px-6">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-2xl ${
                        selectedChat.id === chat.id ? "bg-black text-white" : ""
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 border-2 border-gray-100">
                            <AvatarImage src={chat.partnerAvatar || "/placeholder.svg"} />
                            <AvatarFallback className="font-bold">
                              {chat.partnerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {chat.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`font-black truncate ${selectedChat.id === chat.id ? "text-white" : "text-gray-900"}`}
                            >
                              {chat.partnerName}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs font-bold ${selectedChat.id === chat.id ? "text-gray-300" : "text-gray-500"}`}
                              >
                                {chat.lastMessageTime}
                              </span>
                              {chat.unreadCount > 0 && (
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    selectedChat.id === chat.id ? "bg-white text-black" : "bg-black text-white"
                                  }`}
                                >
                                  {chat.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                          <p
                            className={`text-sm font-medium truncate mt-1 ${selectedChat.id === chat.id ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {chat.lastMessage}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`mt-2 text-xs font-bold rounded-full ${
                              selectedChat.id === chat.id ? "bg-white text-black" : "bg-gray-100 text-black"
                            }`}
                          >
                            {chat.subject}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="minimal-card border-0 shadow-lg h-full flex flex-col holographic-border">
              {/* Chat Header */}
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-gray-100">
                        <AvatarImage src={selectedChat.partnerAvatar || "/placeholder.svg"} />
                        <AvatarFallback className="font-bold">
                          {selectedChat.partnerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {selectedChat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-lg">{selectedChat.partnerName}</h3>
                      <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">
                        {selectedChat.isOnline ? "Online" : "Recently active"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                      <Calendar className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] p-6">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-6 py-4 ${
                            message.isOwn ? "bg-black text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="font-medium">{message.text}</p>
                          <p
                            className={`text-xs mt-2 font-bold tracking-wide uppercase ${
                              message.isOwn ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-12 h-12 rounded-full border-2 border-gray-100 font-medium focus:border-black transition-colors"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-100"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-black hover:bg-gray-800 rounded-full w-12 h-12 p-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
