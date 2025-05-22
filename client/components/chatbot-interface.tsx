"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock chat messages
const initialMessages = [
  {
    role: "assistant",
    content: "👋 Hi there! I'm FlexFit-AI, your personal fitness assistant. How can I help you today?",
  },
  {
    role: "user",
    content: "I want to build muscle but I only have 30 minutes per day to workout.",
  },
  {
    role: "assistant",
    content:
      "That's totally doable! I recommend focusing on compound exercises like squats, deadlifts, and bench press to maximize your 30-minute sessions. Would you like me to create a quick 30-minute strength routine for you?",
  },
]

export default function ChatbotInterface() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      // Add user message
      setMessages([...messages, { role: "user", content: input }])

      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I understand what you're looking for. To get started with a personalized plan, click the 'Get Started' button below and I'll guide you through the process!",
          },
        ])
      }, 1000)

      setInput("")
    }
  }

  return (
    <Card className="w-full border shadow-lg">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">F</span>
          </div>
          FlexFit-AI
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Ask FlexFit-AI about workouts, nutrition, or fitness goals..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
