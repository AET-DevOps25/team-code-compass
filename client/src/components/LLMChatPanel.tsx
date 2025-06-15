import { useState, useRef, useEffect } from 'react'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, Sparkles, User } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export function LLMChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '🏋️ Welcome to FlexFit AI! I\'m here to help with your fitness journey. How can I assist you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return '💪 Great question about workouts! Based on your current preferences, I recommend focusing on compound movements. Here are some suggestions:\n\n• **Push-ups**: 3 sets of 8-12 reps\n• **Squats**: 3 sets of 12-15 reps\n• **Planks**: Hold for 30-60 seconds\n\nWould you like me to create a personalized routine?'
    }
    
    if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('food')) {
      return '🥗 Nutrition is key to reaching your fitness goals! Here are some general guidelines:\n\n• **Protein**: 0.8-1g per pound of body weight\n• **Hydration**: 8-10 glasses of water daily\n• **Timing**: Eat protein within 30min post-workout\n\nWould you like specific meal recommendations?'
    }
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan') || lowerMessage.includes('routine')) {
      return '📅 Let\'s optimize your workout schedule! I see you have some workouts planned this week. Here\'s what I recommend:\n\n• **Consistency**: 3-4 workouts per week\n• **Recovery**: At least 1 rest day between intense sessions\n• **Progression**: Gradually increase intensity\n\nShall I help you adjust your current schedule?'
    }
    
    if (lowerMessage.includes('motivation') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return '🌟 You\'ve got this! Remember why you started your fitness journey. Every workout, no matter how small, is progress. Here are some motivation tips:\n\n• **Track Progress**: Celebrate small wins\n• **Find Your Why**: Connect to your deeper goals\n• **Community**: Share your journey with others\n\nWhat\'s your biggest fitness goal right now?'
    }
    
    return '🤖 I\'m here to help with your fitness journey! I can assist with:\n\n• **Workout Planning** 💪\n• **Nutrition Advice** 🥗\n• **Schedule Optimization** 📅\n• **Motivation & Support** 🌟\n\nWhat would you like to focus on today?'
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(inputMessage),
        role: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (action: string) => {
    setInputMessage(action)
  }

  const quickActions = [
    "Create a workout plan",
    "Nutrition advice",
    "Track my progress",
    "Motivate me!"
  ]

  return (
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="relative">
            <Bot className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          FlexFit AI Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-line ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/90 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/90 text-gray-800 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => handleQuickAction(action)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {action}
            </Button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about fitness..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  )
} 