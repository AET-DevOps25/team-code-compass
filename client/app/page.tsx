"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CalendarIcon,
  Dumbbell,
  MessageCircle,
  Settings,
  Send,
  Target,
  Heart,
  Activity,
  CheckCircle,
  Circle,
  Coffee,
  Play,
  Timer,
  Flame,
  ChevronLeft,
  ChevronRight,
  Zap,
  Check,
  Moon,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useAuth } from "../src/hooks/useAuth"
import { Gender } from "../src/types/user"
import { workoutService } from "../src/services/workoutService"
import { SportType as WorkoutServiceSportType } from "../src/types/workout"
import { useTts } from "../src/hooks/useTts"
import { formatDateForAPI, getTodayLocalDate } from "../src/utils/dateUtils"

// Types and Enums
enum FitnessGoal {
  WEIGHT_LOSS = "Weight Loss",
  MUSCLE_GAIN = "Muscle Gain",
  ENDURANCE = "Endurance",
  STRENGTH = "Strength",
  FLEXIBILITY = "Flexibility",
  GENERAL_FITNESS = "General Fitness",
}

enum ExperienceLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
  EXPERT = "Expert",
}

enum WorkoutType {
  CARDIO = "Cardio",
  STRENGTH = "Strength Training",
  HIIT = "HIIT",
  YOGA = "Yoga",
  PILATES = "Pilates",
  CROSSFIT = "CrossFit",
  SWIMMING = "Swimming",
  RUNNING = "Running",
}

enum Equipment {
  NONE = "No Equipment",
  BASIC = "Basic (Dumbbells, Mat)",
  HOME_GYM = "Home Gym",
  FULL_GYM = "Full Gym Access",
}

enum TimePreference {
  MORNING = "Morning (6-10 AM)",
  AFTERNOON = "Afternoon (12-4 PM)",
  EVENING = "Evening (6-9 PM)",
  FLEXIBLE = "Flexible",
}

enum IntensityLevel {
  LOW = "Low",
  MODERATE = "Moderate",
  HIGH = "High",
  EXTREME = "Extreme",
}

enum BodyFocus {
  FULL_BODY = "Full Body",
  UPPER_BODY = "Upper Body",
  LOWER_BODY = "Lower Body",
  CORE = "Core",
  ARMS = "Arms",
  LEGS = "Legs",
}



enum WorkoutStatus {
  COMPLETED = "completed",
  PLANNED = "planned",
  NONE = "none",
  REST = "rest",
}

interface UserPreferences {
  fitnessGoal: FitnessGoal
  experienceLevel: ExperienceLevel
  preferredWorkouts: WorkoutType[]
  equipment: Equipment
  timePreference: TimePreference
  intensityLevel: IntensityLevel
  bodyFocus: BodyFocus
  age: number
  workoutDuration: number
  workoutsPerWeek: number
}

interface WorkoutSession {
  id: string
  name: string
  type: WorkoutType
  duration: number
  difficulty: IntensityLevel
  equipment: Equipment
  status: WorkoutStatus
  content: string // Markdown content
  date: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function FlexFitApp() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    fitnessGoal: FitnessGoal.GENERAL_FITNESS,
    experienceLevel: ExperienceLevel.BEGINNER,
    preferredWorkouts: [WorkoutType.STRENGTH, WorkoutType.CARDIO],
    equipment: Equipment.BASIC,
    timePreference: TimePreference.EVENING,
    intensityLevel: IntensityLevel.MODERATE,
    bodyFocus: BodyFocus.FULL_BODY,
    age: 25,
    workoutDuration: 45,
    workoutsPerWeek: 3,
  })
  
  // Dynamic workout sessions state
  const [workoutSessions, setWorkoutSessions] = useState<Record<string, WorkoutSession>>({})
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false)
  const [workoutError, setWorkoutError] = useState<string | null>(null)

  // Workout generation state
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // TTS state
  const {
    isGenerating: isGeneratingAudio,
    isSynthesizing,
    error: ttsError,
    audioUrl,
    audioBlob,
    availableVoices,
    isLoadingVoices,
    generateAudio,
    synthesizeAudio,
    loadAvailableVoices,
    clearError: clearTtsError,
    clearAudio
  } = useTts()
  const [selectedVoice, setSelectedVoice] = useState<string>('en-US-Neural2-F')

  // Function to load workouts from backend
  const loadWorkouts = useCallback(async () => {
    if (!user?.id) return

    setIsLoadingWorkouts(true)
    setWorkoutError(null)

    try {
      // Get workouts for current month
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const response = await workoutService.getMyWorkoutsByDateRange({
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate)
      }, user.id)

      if (response.error) {
        setWorkoutError(response.error.error)
        return
      }

      const workouts = response.data || []
      const workoutMap: Record<string, WorkoutSession> = {}

      // Convert backend workouts to frontend format
      workouts.forEach(workout => {
        const sportTypeMap: Record<string, WorkoutType> = {
          'STRENGTH': WorkoutType.STRENGTH,
          'HIIT': WorkoutType.HIIT,
          'YOGA_MOBILITY': WorkoutType.YOGA,
          'RUNNING_INTERVALS': WorkoutType.RUNNING
        }

        const statusMap: Record<string, WorkoutStatus> = {
          'COMPLETED': WorkoutStatus.COMPLETED,
          'PENDING': WorkoutStatus.PLANNED,
          'IN_PROGRESS': WorkoutStatus.PLANNED,
          'SKIPPED': WorkoutStatus.NONE
        }

        workoutMap[workout.dayDate] = {
          id: workout.id,
          name: `${workout.focusSportTypeForTheDay.replace('_', ' ')} Training`,
          type: sportTypeMap[workout.focusSportTypeForTheDay] || WorkoutType.STRENGTH,
          duration: workout.scheduledExercises?.reduce((total, exercise) => {
            const match = exercise.prescribedSetsRepsDuration.match(/(\d+)\s*(?:min|minute)/i)
            return total + (match ? parseInt(match[1]) : 0)
          }, 0) || 30,
          difficulty: IntensityLevel.MODERATE,
          equipment: Equipment.BASIC,
          status: statusMap[workout.completionStatus] || WorkoutStatus.PLANNED,
          content: workout.markdownContent || '',
          date: workout.dayDate
        }
      })

      setWorkoutSessions(workoutMap)
    } catch (error) {
      console.error('Error loading workouts:', error)
      setWorkoutError('Failed to load workouts')
    } finally {
      setIsLoadingWorkouts(false)
    }
  }, [user?.id, currentMonth])

  // Function to refresh workouts after generation
  const refreshWorkouts = useCallback(async () => {
    await loadWorkouts()
  }, [loadWorkouts])

  // Function to add a new workout to the sessions
  const addWorkoutToSessions = useCallback((workout: any) => {
    const sportTypeMap: Record<string, WorkoutType> = {
      'STRENGTH': WorkoutType.STRENGTH,
      'HIIT': WorkoutType.HIIT,
      'YOGA_MOBILITY': WorkoutType.YOGA,
      'RUNNING_INTERVALS': WorkoutType.RUNNING
    }

    const newWorkoutSession: WorkoutSession = {
      id: workout.id,
      name: `${workout.focusSportTypeForTheDay.replace('_', ' ')} Training`,
      type: sportTypeMap[workout.focusSportTypeForTheDay] || WorkoutType.STRENGTH,
      duration: workout.scheduledExercises?.reduce((total: number, exercise: any) => {
        const match = exercise.prescribedSetsRepsDuration.match(/(\d+)\s*(?:min|minute)/i)
        return total + (match ? parseInt(match[1]) : 0)
      }, 0) || 30,
      difficulty: IntensityLevel.MODERATE,
      equipment: Equipment.BASIC,
      status: WorkoutStatus.PLANNED,
      content: workout.markdownContent || '',
      date: workout.dayDate
    }

    setWorkoutSessions(prev => ({
      ...prev,
      [workout.dayDate]: newWorkoutSession
    }))
  }, [])

  // Load workouts when component mounts or month changes
  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts, currentMonth])

  // Clear workouts when user logs out
  useEffect(() => {
    if (!user?.id) {
      setWorkoutSessions({})
    }
  }, [user?.id])

  useEffect(() => {
    // Load workout for selected date with proper error handling
    const dateKey = formatDateForAPI(selectedDate)
    const workout = workoutSessions[dateKey] || null
    setCurrentWorkout(workout)

    // Debug log to verify data loading
    console.log(`Selected date: ${dateKey}, Workout found:`, workout ? workout.name : "None")
  }, [selectedDate, workoutSessions])

  const getDateStatus = (date: Date): WorkoutStatus => {
    const dateKey = formatDateForAPI(date)
    const workout = workoutSessions[dateKey]
    return workout?.status || WorkoutStatus.NONE
  }

  const getStatusColor = (status: WorkoutStatus): string => {
    switch (status) {
      case WorkoutStatus.COMPLETED:
        return "bg-green-500"
      case WorkoutStatus.PLANNED:
        return "bg-blue-500"
      case WorkoutStatus.REST:
        return "bg-yellow-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusIcon = (status: WorkoutStatus) => {
    switch (status) {
      case WorkoutStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case WorkoutStatus.PLANNED:
        return <Play className="h-4 w-4 text-blue-600" />
      case WorkoutStatus.REST:
        return <Coffee className="h-4 w-4 text-yellow-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusTooltip = (status: WorkoutStatus, workoutName?: string): string => {
    switch (status) {
      case WorkoutStatus.COMPLETED:
        return `✅ Completed${workoutName ? `: ${workoutName}` : ""}`
      case WorkoutStatus.PLANNED:
        return `🏋️ Planned Workout${workoutName ? `: ${workoutName}` : ""}`
      case WorkoutStatus.REST:
        return `💤 Rest Day${workoutName ? `: ${workoutName}` : ""}`
      default:
        return "Available for scheduling"
    }
  }

  const getDateBorderStyle = (status: WorkoutStatus, isSelected: boolean): string => {
    if (isSelected) {
      return "border-blue-600 shadow-lg scale-105"
    }

    switch (status) {
      case WorkoutStatus.COMPLETED:
        return "border-green-200 hover:border-green-300 hover:shadow-green-100 hover:shadow-md"
      case WorkoutStatus.PLANNED:
        return "border-blue-200 hover:border-blue-300 hover:shadow-blue-100 hover:shadow-md"
      case WorkoutStatus.REST:
        return "border-yellow-200 hover:border-yellow-300 hover:shadow-yellow-100 hover:shadow-md"
      default:
        return "border-gray-200 hover:border-gray-300"
    }
  }

  const getDateBackgroundStyle = (status: WorkoutStatus, isSelected: boolean, isToday: boolean): string => {
    if (isSelected) {
      return "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
    }

    if (isToday) {
      return "bg-blue-50 text-blue-700"
    }

    switch (status) {
      case WorkoutStatus.COMPLETED:
        return "bg-gradient-to-br from-green-50 to-emerald-50 text-gray-700 hover:from-green-100 hover:to-emerald-100"
      case WorkoutStatus.PLANNED:
        return "bg-gradient-to-br from-blue-50 to-sky-50 text-gray-700 hover:from-blue-100 hover:to-sky-100"
      case WorkoutStatus.REST:
        return "bg-gradient-to-br from-yellow-50 to-amber-50 text-gray-700 hover:from-yellow-100 hover:to-amber-100"
      default:
        return "bg-white text-gray-700 hover:bg-gray-50"
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  // Helper to map WorkoutType to backend SportType
  const mapWorkoutTypeToSportType = (workoutType?: WorkoutType): string => {
    switch (workoutType) {
      case WorkoutType.STRENGTH:
        return 'STRENGTH'
      case WorkoutType.HIIT:
        return 'HIIT'
      case WorkoutType.YOGA:
        return 'YOGA_MOBILITY'
      case WorkoutType.RUNNING:
        return 'RUNNING_INTERVALS'
      case WorkoutType.CARDIO:
        return 'RUNNING_INTERVALS'
      default:
        return 'STRENGTH'
    }
  }

  // Workout generation handlers
  const handleGenerateDailyWorkout = async () => {
    if (!user?.id) {
      setGenerationStatus({
        type: 'error',
        message: 'Please login to generate workouts'
      })
      return
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      // Map frontend LLM preference to backend AI preference
      const aiPreference = llmPreference === 'cloud' ? 'cloud' : 'local'
      
      const requestBody = {
        userId: user.id,
        dayDate: getTodayLocalDate(),
        focusSportType: mapWorkoutTypeToSportType(userPreferences.preferredWorkouts[0]),
        targetDurationMinutes: userPreferences.workoutDuration,
        aiPreference: aiPreference,
        ...(customPrompt.trim() && { textPrompt: customPrompt.trim() })
      }

      console.log('Daily workout request:', requestBody)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/workout-plan-service/api/v1/plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('flexfit_token')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const workout = await response.json()
        setGenerationStatus({
          type: 'success',
          message: 'Daily workout generated successfully!'
        })
        // Refresh workouts to show the new one
        await loadWorkouts()
      } else {
        const errorText = await response.text()
        console.error('Daily workout error response:', response.status, errorText)
        throw new Error(`Failed to generate workout: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Daily workout error:', error)
      setGenerationStatus({
        type: 'error',
        message: `Failed to generate workout: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateWeeklyWorkout = async () => {
    if (!user?.id) {
      setGenerationStatus({
        type: 'error',
        message: 'Please login to generate workouts'
      })
      return
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      // Map frontend LLM preference to backend AI preference
      const aiPreference = llmPreference === 'cloud' ? 'cloud' : 'local'
      
      const requestBody = {
        userId: user.id,
        dayDate: getTodayLocalDate(),
        focusSportType: mapWorkoutTypeToSportType(userPreferences.preferredWorkouts[0]),
        targetDurationMinutes: userPreferences.workoutDuration,
        aiPreference: aiPreference,
        ...(customPrompt.trim() && { textPrompt: customPrompt.trim() })
      }

      console.log('Weekly workout request:', requestBody)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/workout-plan-service/api/v1/plans/generate-weekly-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('flexfit_token')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const weeklyWorkouts = await response.json()
        setGenerationStatus({
          type: 'success',
          message: `Weekly plan generated successfully! Created ${Array.isArray(weeklyWorkouts) ? weeklyWorkouts.length : '7'} workouts.`
        })
        // Refresh workouts to show the new ones
        await loadWorkouts()
      } else {
        const errorText = await response.text()
        console.error('Weekly workout error response:', response.status, errorText)
        throw new Error(`Failed to generate weekly plan: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Weekly workout error:', error)
      setGenerationStatus({
        type: 'error',
        message: `Failed to generate weekly plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateQueueWeeklyWorkout = async () => {
    if (!user?.id) {
      setGenerationStatus({
        type: 'error',
        message: 'Please login to generate workouts'
      })
      return
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    // Add initial message to chat
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: "🚀 Starting Queue Weekly Plan generation! I'll create 7 workouts sequentially...",
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, initialMessage])

    try {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

      let successCount = 0
      let errorCount = 0
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      // Generate workouts one by one sequentially
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek)
        currentDate.setDate(startOfWeek.getDate() + i)
        const dayName = dayNames[i]
        
        // Add progress message to chat
        const progressMessage: ChatMessage = {
          id: (Date.now() + i + 100).toString(),
          role: "assistant",
          content: `⏳ Generating workout for ${dayName} (${currentDate.toISOString().split('T')[0]})...`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, progressMessage])

        // Build enhanced prompt with workout history context
        let enhancedPrompt = customPrompt.trim()
        if (lastWeeksWorkouts && lastWeeksWorkouts.length > 0) {
          const recentExercises = lastWeeksWorkouts.flatMap(w => 
            w.scheduledExercises?.map((e: any) => e.exerciseName) || []
          ).join(', ')
          
          enhancedPrompt += enhancedPrompt ? ' | ' : ''
          enhancedPrompt += `Consider recent workouts from last 7 days for variety and recovery. Recent exercises: ${recentExercises}`
        }

                const requestBody = {
          userId: user.id,
          dayDate: currentDate.toISOString().split('T')[0],
          focusSportType: mapWorkoutTypeToSportType(userPreferences.preferredWorkouts[0]),
          targetDurationMinutes: userPreferences.workoutDuration,
          ...(enhancedPrompt && { textPrompt: enhancedPrompt })
        }

        console.log(`Generating workout for ${dayName} (${currentDate.toISOString().split('T')[0]}):`, requestBody)

        // Add progress message to chat
        const progressMessage: ChatMessage = {
          id: (Date.now() + i).toString(),
          role: "assistant",
          content: `⏳ Generating workout for ${dayName} (${currentDate.toISOString().split('T')[0]})...`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, progressMessage])

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/workout-plan-service/api/v1/plans/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('flexfit_token')}`
            },
            body: JSON.stringify(requestBody)
          })

          if (response.ok) {
            const workout = await response.json()
            successCount++
            
            // Add success message to chat
            const successMessage: ChatMessage = {
              id: Date.now() + i + 1000,
              role: "assistant",
              content: `✅ ${dayName} workout generated successfully! Created "${workout.name || 'Workout'}" with ${workout.exercises?.length || 'several'} exercises.`
            }
            setChatMessages(prev => [...prev, successMessage])

          } else {
            errorCount++
            const errorText = await response.text()
            console.error(`${dayName} error:`, response.status, errorText)
            
            // Add error message to chat
            const errorMessage: ChatMessage = {
              id: Date.now() + i + 2000,
              role: "assistant", 
              content: `❌ Failed to generate ${dayName} workout: ${response.status} - ${errorText}`
            }
            setChatMessages(prev => [...prev, errorMessage])
          }

        } catch (error) {
          errorCount++
          console.error(`${dayName} failed:`, error)
          
          // Add error message to chat
          const errorMessage: ChatMessage = {
            id: Date.now() + i + 3000,
            role: "assistant",
            content: `❌ ${dayName} workout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
          setChatMessages(prev => [...prev, errorMessage])
        }

        // Small delay between requests to avoid overwhelming the server
        if (i < 6) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Final summary message
      const summaryMessage: ChatMessage = {
        id: Date.now() + 10000,
        role: "assistant",
        content: `🎉 Queue Weekly Plan completed! Successfully generated ${successCount}/7 workouts.${errorCount > 0 ? ` ${errorCount} failed.` : ' All workouts created successfully!'}`
      }
      setChatMessages(prev => [...prev, summaryMessage])

      if (successCount > 0) {
        setGenerationStatus({
          type: 'success',
          message: `Queue weekly plan completed! Successfully generated ${successCount}/7 workouts.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`
        })
        // Refresh workouts to show the new ones
        await loadWorkouts()
      } else {
        throw new Error('All workout generations failed')
      }

    } catch (error) {
      console.error('Queue weekly workout error:', error)
      
      // Add final error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now() + 20000,
        role: "assistant",
        content: `💥 Queue Weekly Plan failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      setChatMessages(prev => [...prev, errorMessage])

      setGenerationStatus({
        type: 'error',
        message: `Failed to generate queue weekly plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])

    // Show "typing" indicator
    const typingMessage: ChatMessage = {
      id: "typing",
      role: "assistant",
      content: "🤖 Generating your workout plan...",
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, typingMessage])

    try {
      const input = chatInput.toLowerCase()
      let responseContent = ""

      // Check for workout generation requests first
      if (input.includes("create") && (input.includes("workout") || input.includes("training") || input.includes("plan")) || 
          input.includes("generate") && input.includes("workout") ||
          input.includes("crossfit") || input.includes("week") && input.includes("training")) {
        
        const workoutRequest = parseWorkoutRequest(input)
        responseContent = await generateWorkoutPlan(workoutRequest)
        
      } else if (input.includes("workout") || input.includes("exercise")) {
        responseContent = `Here are some workout suggestions based on your ${userPreferences.fitnessGoal} goal and ${userPreferences.experienceLevel} level:\n\n• ${getWorkoutSuggestion()}\n• Try saying "create me a 1 week crossfit training" for AI-generated plans\n• I can help you adjust intensity or duration if needed!`
      } else if (input.includes("diet") || input.includes("nutrition") || input.includes("food")) {
        responseContent = `For your ${userPreferences.fitnessGoal} goal, here are some nutrition tips:\n\n• Focus on balanced meals with protein, carbs, and healthy fats\n• Stay hydrated throughout the day\n• Eat plenty of fruits and vegetables\n\nWould you like specific meal suggestions?`
      } else if (input.includes("help") || input.includes("?")) {
        responseContent = `I'm here to help with your fitness journey! I can assist with:\n\n• 💪 **AI Workout Generation** - Say "create me a 1 week crossfit training"\n• 📅 Scheduling your fitness routine\n• 🥗 Basic nutrition guidance\n• ⚙️ Adjusting your preferences\n\n**Try these commands:**\n• "Create me a 3 day strength training"\n• "Generate a week of HIIT workouts"\n• "I need a yoga session"`
      } else if (input.includes("schedule") || input.includes("time") || input.includes("when")) {
        responseContent = `Based on your ${userPreferences.timePreference} preference, I recommend:\n\n• Aim for ${userPreferences.workoutsPerWeek} workouts per week\n• Each session around ${userPreferences.workoutDuration} minutes\n• Use the calendar above to track your progress\n\nWould you like me to generate a specific workout schedule?`
      } else {
        responseContent = `I understand you're asking about "${chatInput}". As your AI fitness assistant, I can:\n\n🤖 **Generate Real Workouts** - Try: "create me a 1 week crossfit training"\n📋 **Plan Your Schedule** - I'll create personalized workout plans\n💾 **Save Everything** - All workouts are saved to your calendar\n\nCurrent preferences: ${userPreferences.fitnessGoal}, ${userPreferences.experienceLevel} level\n\nWhat workout would you like me to create?`
      }

      // Remove typing indicator and add real response
      setChatMessages((prev) => prev.filter(msg => msg.id !== "typing"))
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiResponse])
      
    } catch (error) {
      console.error("Chat error:", error)
      
      // Remove typing indicator and show error
      setChatMessages((prev) => prev.filter(msg => msg.id !== "typing"))
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Sorry, I encountered an error. Please try again or make sure you're logged in.",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorResponse])
    }

    setChatInput("")
  }

  // TTS handlers
  const handleGenerateAudio = async () => {
    if (!currentWorkout?.content) {
      return
    }

    // Convert markdown to plain text for TTS
    const plainText = currentWorkout.content
      .replace(/[#*`]/g, '') // Remove markdown formatting
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()

    if (!plainText) {
      return
    }

    await generateAudio({
      text: plainText,
      voiceName: selectedVoice,
      languageCode: 'en-US',
      audioEncoding: 'MP3'
    })
  }

  const handleDownloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workout-voice-over-${new Date().toISOString().split('T')[0]}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getWorkoutSuggestion = (): string => {
    const workoutTypes = userPreferences.preferredWorkouts
    const equipment = userPreferences.equipment
    const intensity = userPreferences.intensityLevel
    
    if (workoutTypes.includes(WorkoutType.STRENGTH)) {
      return `${intensity} strength training with ${equipment.toLowerCase()}`
    } else if (workoutTypes.includes(WorkoutType.CARDIO)) {
      return `${intensity} cardio session (${userPreferences.workoutDuration} minutes)`
    } else if (workoutTypes.includes(WorkoutType.HIIT)) {
      return `${intensity} HIIT workout for maximum efficiency`
    } else {
      return `${intensity} ${workoutTypes[0]?.toLowerCase()} session`
    }
  }

  const parseWorkoutRequest = (input: string) => {
    const lowerInput = input.toLowerCase()
    
    // Extract days with more sophisticated patterns
    let days = 1
    
    // Check for specific day patterns
    const dayPatterns = [
      { pattern: /(\d+)\s*(?:day|days)/i, multiplier: 1 },
      { pattern: /(\d+)\s*(?:week|weeks)/i, multiplier: 7 },
      { pattern: /(?:a|one)\s*week/i, value: 7 },
      { pattern: /(?:two|2)\s*week/i, value: 14 },
      { pattern: /(?:three|3)\s*week/i, value: 21 },
      { pattern: /(?:four|4)\s*week/i, value: 28 },
      { pattern: /(?:half|0\.5)\s*week/i, value: 3 },
      { pattern: /(?:full|complete)\s*week/i, value: 7 },
      { pattern: /(?:quick|short)\s*(?:week|plan)/i, value: 3 },
      { pattern: /(?:intensive|intense)\s*(?:week|plan)/i, value: 5 },
      { pattern: /(?:month|monthly)/i, value: 30 }
    ]

    for (const { pattern, multiplier, value } of dayPatterns) {
      const match = lowerInput.match(pattern)
      if (match) {
        if (value) {
          days = value
        } else if (multiplier && match[1]) {
          days = parseInt(match[1]) * multiplier
        }
        break
      }
    }

    // Ensure days is within reasonable bounds
    days = Math.max(1, Math.min(30, days))

    // Enhanced sport type mapping with more keywords
    let sportType = WorkoutServiceSportType.STRENGTH // default
    
    const sportPatterns = [
      {
        type: WorkoutServiceSportType.HIIT,
        keywords: ['hiit', 'crossfit', 'cross fit', 'tabata', 'circuit', 'intervals', 'intensive', 'intense', 'cardio blast', 'fat burn', 'metabolic']
      },
      {
        type: WorkoutServiceSportType.STRENGTH,
        keywords: ['strength', 'weight', 'muscle', 'lifting', 'resistance', 'bodybuilding', 'powerlifting', 'gains', 'bulk', 'pump', 'iron']
      },
      {
        type: WorkoutServiceSportType.YOGA_MOBILITY,
        keywords: ['yoga', 'mobility', 'stretch', 'flexibility', 'pilates', 'mindful', 'meditation', 'zen', 'flow', 'balance', 'relaxation']
      },
      {
        type: WorkoutServiceSportType.RUNNING_INTERVALS,
        keywords: ['running', 'cardio', 'endurance', 'marathon', 'sprint', 'jog', 'treadmill', 'outdoor', 'distance', 'pace']
      }
    ]

    for (const { type, keywords } of sportPatterns) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        sportType = type
        break
      }
    }

    // Extract duration with more patterns
    let duration = userPreferences.workoutDuration
    const durationPatterns = [
      /(\d+)\s*(?:min|minute|minutes)/i,
      /(\d+)\s*(?:hour|hours|hr|hrs)/i,
      /(?:quick|short)\s*(?:workout|session)/i,
      /(?:long|extended)\s*(?:workout|session)/i,
      /(?:full|complete)\s*(?:workout|session)/i
    ]

    for (const pattern of durationPatterns) {
      const match = lowerInput.match(pattern)
      if (match) {
        if (match[1]) {
          const value = parseInt(match[1])
          // Convert hours to minutes if necessary
          duration = pattern.source.includes('hour') ? value * 60 : value
        } else if (pattern.source.includes('quick|short')) {
          duration = 20
        } else if (pattern.source.includes('long|extended')) {
          duration = 60
        } else if (pattern.source.includes('full|complete')) {
          duration = 45
        }
        break
      }
    }

    // Ensure duration is within reasonable bounds
    duration = Math.max(15, Math.min(120, duration))

    // Extract equipment preferences
    let equipment = null
    const equipmentPatterns = [
      { pattern: /no\s*equipment|bodyweight|body\s*weight/i, value: 'NO_EQUIPMENT' },
      { pattern: /dumbbells?|weights?/i, value: 'DUMBBELLS' },
      { pattern: /kettlebells?/i, value: 'KETTLEBELL' },
      { pattern: /bands?|resistance\s*bands?/i, value: 'RESISTANCE_BANDS' },
      { pattern: /gym|full\s*gym/i, value: 'FULL_GYM' },
      { pattern: /home\s*gym/i, value: 'HOME_GYM' }
    ]

    for (const { pattern, value } of equipmentPatterns) {
      if (pattern.test(lowerInput)) {
        equipment = value
        break
      }
    }

    // Extract fitness level
    let fitnessLevel = null
    const levelPatterns = [
      { pattern: /beginner|newbie|new\s*to/i, value: 'BEGINNER' },
      { pattern: /intermediate|moderate/i, value: 'INTERMEDIATE' },
      { pattern: /advanced|experienced/i, value: 'ADVANCED' },
      { pattern: /expert|professional/i, value: 'EXPERT' }
    ]

    for (const { pattern, value } of levelPatterns) {
      if (pattern.test(lowerInput)) {
        fitnessLevel = value
        break
      }
    }

    return { 
      days, 
      sportType, 
      duration,
      equipment,
      fitnessLevel,
      // Add metadata for better responses
      requestType: days > 1 ? 'multi-day' : 'single-day',
      sportName: sportType.replace('_', ' ').toLowerCase(),
      isQuick: lowerInput.includes('quick') || lowerInput.includes('short'),
      isIntense: lowerInput.includes('intense') || lowerInput.includes('intensive')
    }
  }

  const generateWorkoutPlan = async (request: any) => {
    if (!user?.id) {
      return "❌ Please log in to generate workout plans!"
    }

    const { days, sportType, duration, equipment, fitnessLevel, requestType, sportName, isQuick, isIntense } = request

    try {
      const today = new Date()
      const generatedWorkouts = []
      const totalWorkouts = days
      let currentWorkout = 0

      // Show initial progress message for multi-day plans
      if (days > 1) {
        const progressMessage: ChatMessage = {
          id: "progress",
          role: "assistant",
          content: `🚀 **Starting ${days}-day ${sportName} plan generation...**\n\n📊 **Progress: 0/${totalWorkouts} workouts created**\n\n⏳ This may take a few moments...`,
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev.filter(msg => msg.id !== "typing"), progressMessage])
      }

      for (let i = 0; i < days; i++) {
        const workoutDate = new Date(today)
        workoutDate.setDate(today.getDate() + i)
        
        try {
          // Map frontend LLM preference to backend AI preference
          const aiPreference = llmPreference === 'cloud' ? 'cloud' : 'local'
          
          const response = await workoutService.generateWorkoutPlan({
            sportType,
            targetDurationMinutes: duration,
            date: formatDateForAPI(workoutDate),
            aiPreference: aiPreference
          }, user.id)

          if (response.data) {
            generatedWorkouts.push({
              date: workoutDate.toLocaleDateString(),
              workout: response.data
            })
            currentWorkout++

            // Update progress for multi-day plans
            if (days > 1) {
              const progressMessage: ChatMessage = {
                id: "progress",
                role: "assistant",
                content: `🚀 **Generating ${days}-day ${sportName} plan...**\n\n📊 **Progress: ${currentWorkout}/${totalWorkouts} workouts created**\n\n${currentWorkout === totalWorkouts ? '🎉 **Generation complete!**' : '⏳ Working on next workout...'}`,
                timestamp: new Date(),
              }
              setChatMessages((prev) => [...prev.filter(msg => msg.id !== "progress"), progressMessage])
            }
          }
        } catch (error) {
          console.error(`Error generating workout ${i + 1}:`, error)
          // Continue with next workout even if one fails
        }
      }

      // Remove progress message
      setChatMessages((prev) => prev.filter(msg => msg.id !== "progress"))

      if (generatedWorkouts.length === 0) {
        return "❌ Failed to generate workout plan. Please try again."
      }

      // Format response based on request type
      const intensity = isIntense ? "INTENSE" : isQuick ? "QUICK" : sportName.toUpperCase()
      let responseText = `🎉 **${days}-Day ${intensity} Training Plan Generated!**\n\n`
      
      if (days === 1) {
        const workout = generatedWorkouts[0].workout
        responseText += `📅 **${generatedWorkouts[0].date}**\n`
        responseText += `💪 **${workout.scheduledExercises?.length || 0} exercises** • **${duration} minutes**\n`
        responseText += isIntense ? `⚡ **High intensity focus**\n` : isQuick ? `⚡ **Quick & effective**\n` : `🎯 **Balanced training**\n`
        responseText += `\n${workout.markdownContent ? workout.markdownContent.substring(0, 300) + "..." : "Workout plan created successfully!"}`
      } else {
        responseText += `📈 **Generated ${generatedWorkouts.length} out of ${days} requested workouts**\n\n`
        
        const failedCount = days - generatedWorkouts.length
        if (failedCount > 0) {
          responseText += `⚠️ **${failedCount} workouts failed to generate** - you can try regenerating them individually\n\n`
        }

        generatedWorkouts.forEach((item, index) => {
          const workout = item.workout
          responseText += `📅 **Day ${index + 1}: ${item.date}**\n`
          responseText += `• ${workout.scheduledExercises?.length || 0} exercises\n`
          responseText += `• ${duration} minutes\n`
          responseText += `• Focus: ${workout.focusSportTypeForTheDay.replace('_', ' ')}\n\n`
        })
        
        responseText += `✅ All workouts saved to your calendar! Check the calendar above to view detailed exercise plans.\n\n`
        responseText += `💡 **Tip:** Click on any date in the calendar to view the full workout details!`
      }

      // Add all generated workouts to the calendar state
      generatedWorkouts.forEach(item => {
        addWorkoutToSessions(item.workout)
      })

      // Refresh workouts from backend to ensure calendar is up to date
      await refreshWorkouts()

      // Update current workout if we generated one for today
      const todayString = getTodayLocalDate()
      const todayWorkout = generatedWorkouts.find(w => 
        w.workout.dayDate === todayString
      )
      if (todayWorkout) {
        setCurrentWorkout({
          id: todayWorkout.workout.id,
          name: `${sportName.toUpperCase()} Training`,
          type: WorkoutType.CROSSFIT, // Use local enum for display
          duration,
          difficulty: IntensityLevel.MODERATE,
          equipment: Equipment.BASIC,
          status: WorkoutStatus.PLANNED,
          content: todayWorkout.workout.markdownContent || "",
          date: todayString
        })
      }

      return responseText

    } catch (error) {
      console.error("Error generating workout plan:", error)
      return "❌ Error generating workout plan. Please check if you're logged in and try again."
    }
  }

  const AuthDialog = ({ type }: { type: "login" | "register" }) => {
    const { login, register } = useAuth()
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      username: '',
      dateOfBirth: '',
      gender: Gender.MALE,
      heightCm: 0,
      weightKg: 0
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [detailedError, setDetailedError] = useState<any>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleSubmit = async () => {
      console.group(`🚀 ${type === 'login' ? 'Login' : 'Registration'} Form Submission`);
      console.log('📋 Form data:', {
        email: formData.email,
        username: formData.username,
        passwordLength: formData.password.length,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        heightCm: formData.heightCm,
        weightKg: formData.weightKg
      });
      
      setIsSubmitting(true)
      setError(null)
      setDetailedError(null)

      try {
        if (type === "login") {
          console.log('🔑 Attempting login...');
          const result = await login({
            email: formData.email,
            password: formData.password
          })
          
          console.log('📥 Login result:', result);
          
          if (result.success) {
            console.log('✅ Login successful! Closing dialog...');
            setDialogOpen(false)
            setFormData({
              email: '',
              password: '',
              username: '',
              dateOfBirth: '',
              gender: Gender.MALE,
              heightCm: 0,
              weightKg: 0
            })
          } else {
            console.error('❌ Login failed:', result.error);
            setError(result.error || 'Login failed')
            setDetailedError(result)
          }
        } else {
          console.log('📝 Attempting registration...');
          const result = await register({
            email: formData.email,
            password: formData.password,
            username: formData.username,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            heightCm: formData.heightCm || undefined,
            weightKg: formData.weightKg || undefined
          })
          
          console.log('📥 Registration result:', result);
          
          if (result.success) {
            console.log('🎉 Registration successful! Closing dialog...');
            setDialogOpen(false)
            setFormData({
              email: '',
              password: '',
              username: '',
              dateOfBirth: '',
              gender: Gender.MALE,
              heightCm: 0,
              weightKg: 0
            })
          } else {
            console.error('❌ Registration failed:', result.error);
            setError(result.error || 'Registration failed')
            setDetailedError(result)
          }
        }
      } catch (err) {
        console.error('💥 Unexpected error during submission:', err);
        const errorMsg = 'An unexpected error occurred';
        setError(errorMsg)
        setDetailedError({ error: errorMsg, exception: err })
      } finally {
        setIsSubmitting(false)
        console.groupEnd();
      }
    }

    const handleInputChange = (field: string, value: string | number) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={type === "login" ? "outline" : "default"}
            className={type === "login" ? "bg-white/80 backdrop-blur-sm" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"}
          >
            {type === "login" ? "Login" : "Register"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{type === "login" ? "Welcome Back" : "Join FlexFit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  <div className="font-medium">❌ Error:</div>
                  <div>{error}</div>
                  {/* Show validation details if available */}
                  {detailedError?.error?.details && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(detailedError.error.details).map(([field, message]) => (
                        <div key={field} className="text-xs">
                          • <span className="font-medium capitalize">{field}:</span> {message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Developer info - only show in development */}
                {process.env.NODE_ENV === 'development' && detailedError && (
                  <details className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs">
                    <summary className="cursor-pointer font-medium text-gray-600">
                      🔍 Debug Information (Development Only)
                    </summary>
                    <div className="mt-2 space-y-1">
                      <div><strong>Full Error:</strong> {JSON.stringify(detailedError, null, 2)}</div>
                      <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                      <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                      <div><strong>Current URL:</strong> {window.location.href}</div>
                    </div>
                  </details>
                )}
                
                {/* Helpful tips based on error type */}
                {error?.includes('CORS') && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm">
                    <div className="font-medium">💡 Troubleshooting Tips:</div>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                      <li>Check if the backend server is running on port 8000</li>
                      <li>Verify CORS is properly configured on the server</li>
                      <li>Try refreshing the page and trying again</li>
                    </ul>
                  </div>
                )}
                
                {error?.includes('Network error') && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm">
                    <div className="font-medium">🌐 Network Issues:</div>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                      <li>Check your internet connection</li>
                      <li>Verify the backend server is running</li>
                      <li>Try again in a few moments</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isSubmitting}
              />
              {formData.email && !formData.email.includes('@') && (
                <p className="text-xs text-amber-600">Please enter a valid email address</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isSubmitting}
                placeholder={type === "register" ? "Min. 8 characters" : ""}
              />
              {type === "register" && formData.password && formData.password.length < 8 && (
                <p className="text-xs text-amber-600">Password must be at least 8 characters long</p>
              )}
            </div>
            
            {type === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Your Username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange('gender', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Height (cm)</Label>
                    <Input 
                      id="heightCm" 
                      type="number"
                      placeholder="170"
                      value={formData.heightCm || ''}
                      onChange={(e) => handleInputChange('heightCm', parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Weight (kg)</Label>
                    <Input 
                      id="weightKg" 
                      type="number"
                      placeholder="70"
                      value={formData.weightKg || ''}
                      onChange={(e) => handleInputChange('weightKg', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}
            
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Loading...</>
              ) : (
                type === "login" ? "Sign In" : "Create Account"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Dumbbell className="h-8 w-8 text-blue-600 animate-pulse" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlexFit
            </h1>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute top-4 left-4 flex gap-2">
          <AuthDialog type="login" />
          <AuthDialog type="register" />
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <Dumbbell className="h-12 w-12 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FlexFit
              </h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Your AI-Powered Fitness Journey</h2>
            <p className="text-gray-600">
              Track workouts, get personalized recommendations, and achieve your fitness goals with our intelligent
              assistant.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Personalized Plans</p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Progress Tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const calendarDays = generateCalendarDays()
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FlexFit
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* AI Model Preference Selector */}
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <Select value={llmPreference} onValueChange={(value: 'cloud' | 'local_ollama' | 'local_gpt4all') => setLlmPreference(value)}>
                    <SelectTrigger className="w-40 h-8 text-xs bg-white/80">
                      <SelectValue placeholder="AI Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Cloud AI</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="local_ollama">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Local (Ollama)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="local_gpt4all">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span>Local (GPT4All)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>
                    {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.username || 'User'}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                <Button variant="outline" onClick={logout} className="bg-white/80">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Enhanced Calendar & Workout */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enhanced Custom Calendar */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5" />
                      <span>Workout Calendar</span>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-semibold min-w-[140px] text-center">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>

                  {/* Enhanced Status Legend */}
                  <div className="flex flex-wrap gap-4 text-sm bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-lg ring-2 ring-green-200"></div>
                      <span className="font-medium">Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg ring-2 ring-blue-200"></div>
                      <span className="font-medium">Planned</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg ring-2 ring-yellow-200"></div>
                      <span className="font-medium">Rest Day</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gray-300 shadow-md"></div>
                      <span className="font-medium">Available</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Custom Calendar Grid */}
                  <div className="space-y-4">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1">
                      {dayNames.map((day) => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date, index) => {
                        const status = getDateStatus(date)
                        const workout = workoutSessions[formatDateForAPI(date)]
                        const isSelected = selectedDate?.toDateString() === date.toDateString()
                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                        const isToday = date.toDateString() === new Date().toDateString()

                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDateClick(date)}
                                className={`
                                  relative h-14 w-full rounded-xl text-sm font-medium transition-all duration-300 border-2
                                  ${
                                    isCurrentMonth
                                      ? `${getDateBackgroundStyle(status, isSelected, isToday)} ${getDateBorderStyle(status, isSelected)}`
                                      : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
                                  }
                                  transform hover:scale-105 active:scale-95
                                `}
                              >
                                <span className="relative z-10">{date.getDate()}</span>

                                {/* Enhanced Status Indicator */}
                                {status !== WorkoutStatus.NONE && (
                                  <div className="absolute -top-1 -right-1 z-20">
                                    {/* Glowing ring effect */}
                                    <div
                                      className={`absolute inset-0 w-6 h-6 rounded-full animate-pulse ${
                                        status === WorkoutStatus.COMPLETED
                                          ? "bg-green-400/30"
                                          : status === WorkoutStatus.PLANNED
                                            ? "bg-blue-400/30"
                                            : "bg-yellow-400/30"
                                      }`}
                                    />

                                    {/* Main indicator */}
                                    <div
                                      className={`relative w-6 h-6 rounded-full shadow-lg ring-2 ring-white ${
                                        status === WorkoutStatus.COMPLETED
                                          ? "bg-gradient-to-r from-green-400 to-green-600"
                                          : status === WorkoutStatus.PLANNED
                                            ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                            : "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                      }`}
                                    >
                                      {/* Icon inside indicator */}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        {status === WorkoutStatus.COMPLETED && (
                                          <Check className="w-3 h-3 text-white font-bold" />
                                        )}
                                        {status === WorkoutStatus.PLANNED && (
                                          <Dumbbell className="w-3 h-3 text-white" />
                                        )}
                                        {status === WorkoutStatus.REST && <Moon className="w-3 h-3 text-white" />}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Today indicator */}
                                {isToday && !isSelected && (
                                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                )}

                                {/* Subtle underline for status */}
                                {status !== WorkoutStatus.NONE && !isSelected && (
                                  <div
                                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full ${
                                      status === WorkoutStatus.COMPLETED
                                        ? "bg-green-400"
                                        : status === WorkoutStatus.PLANNED
                                          ? "bg-blue-400"
                                          : "bg-yellow-400"
                                    }`}
                                  />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
                              <p className="font-medium">{date.toLocaleDateString()}</p>
                              <p className="text-sm opacity-90">{getStatusTooltip(status, workout?.name)}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Workout Display with Markdown */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {currentWorkout && getStatusIcon(currentWorkout.status)}
                      <span>{currentWorkout ? currentWorkout.name : "No Workout Scheduled"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{selectedDate.toLocaleDateString()}</Badge>
                      {currentWorkout && (
                        <Badge
                          variant="outline"
                          className={`${
                            currentWorkout.status === WorkoutStatus.COMPLETED
                              ? "border-green-500 text-green-700 bg-green-50"
                              : currentWorkout.status === WorkoutStatus.PLANNED
                                ? "border-blue-500 text-blue-700 bg-blue-50"
                                : currentWorkout.status === WorkoutStatus.REST
                                  ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                                  : "border-gray-500 text-gray-700"
                          }`}
                        >
                          {currentWorkout.status.charAt(0).toUpperCase() + currentWorkout.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentWorkout ? (
                    <div className="space-y-4">
                      {/* Workout Info Bar */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <Timer className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">{currentWorkout.duration}min</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold">{currentWorkout.difficulty}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Zap className="h-5 w-5 text-purple-600" />
                            <span className="font-semibold">{currentWorkout.type}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Markdown Content */}
                      <ScrollArea className="h-96">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8 border-l-4 border-blue-500 pl-4 bg-blue-50 py-2 rounded-r-lg">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-semibold text-gray-700 mb-3 mt-6">{children}</h3>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-6 shadow-sm rounded-lg border border-gray-200">{children}</div>
                              ),
                              th: ({ children }) => (
                                <th className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-b border-gray-100">
                                  {children}
                                </td>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-2 my-4 text-gray-600">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-2 my-4 text-gray-600">{children}</ol>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-blue-500 pl-6 py-3 my-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-r-lg">
                                  <div className="text-blue-800 font-medium">{children}</div>
                                </blockquote>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 border">
                                  {children}
                                </code>
                              ),
                              strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                              p: ({ children }) => <p className="text-gray-600 leading-relaxed my-3">{children}</p>,
                              hr: () => <hr className="my-6 border-gray-300" />,
                            }}
                          >
                            {currentWorkout.content}
                          </ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <Dumbbell className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-700">No workout scheduled</h3>
                      <p className="text-gray-500 mb-6">This day is available for you to add a custom workout</p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                        <Zap className="h-4 w-4 mr-2" />
                        Ask AI to Generate Workout
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preferences & Chat */}
            <div className="space-y-6">
              {/* User Preferences */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Age</Label>
                          <Input
                            type="number"
                            value={userPreferences.age}
                            onChange={(e) =>
                              setUserPreferences((prev) => ({
                                ...prev,
                                age: Number.parseInt(e.target.value) || 0,
                              }))
                            }
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Workouts/Week</Label>
                          <Input
                            type="number"
                            value={userPreferences.workoutsPerWeek}
                            onChange={(e) =>
                              setUserPreferences((prev) => ({
                                ...prev,
                                workoutsPerWeek: Number.parseInt(e.target.value) || 0,
                              }))
                            }
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Fitness Goal</Label>
                        <Select
                          value={userPreferences.fitnessGoal}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              fitnessGoal: value as FitnessGoal,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(FitnessGoal).map((goal) => (
                              <SelectItem key={goal} value={goal}>
                                {goal}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Experience Level</Label>
                        <Select
                          value={userPreferences.experienceLevel}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              experienceLevel: value as ExperienceLevel,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ExperienceLevel).map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Equipment</Label>
                        <Select
                          value={userPreferences.equipment}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              equipment: value as Equipment,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(Equipment).map((eq) => (
                              <SelectItem key={eq} value={eq}>
                                {eq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Time Preference</Label>
                        <Select
                          value={userPreferences.timePreference}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              timePreference: value as TimePreference,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(TimePreference).map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Intensity Level</Label>
                        <Select
                          value={userPreferences.intensityLevel}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              intensityLevel: value as IntensityLevel,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(IntensityLevel).map((intensity) => (
                              <SelectItem key={intensity} value={intensity}>
                                {intensity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Body Focus</Label>
                        <Select
                          value={userPreferences.bodyFocus}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              bodyFocus: value as BodyFocus,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(BodyFocus).map((focus) => (
                              <SelectItem key={focus} value={focus}>
                                {focus}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>


                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* AI Chat Interface with Direct API Buttons */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>AI Workout Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quick Generation Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={handleGenerateDailyWorkout}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2"
                        size="sm"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {isGenerating ? 'Generating...' : 'Daily Workout'}
                      </Button>
                      <Button
                        onClick={handleGenerateWeeklyWorkout}
                        disabled={isGenerating}
                        className="bg-green-600 hover:bg-green-700 text-white py-2"
                        size="sm"
                      >
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {isGenerating ? 'Generating...' : 'Weekly Plan'}
                      </Button>
                      <Button
                        onClick={handleGenerateQueueWeeklyWorkout}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2"
                        size="sm"
                      >
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {isGenerating ? 'Generating...' : 'Queue Weekly'}
                      </Button>
                    </div>

                    {/* Generation Status */}
                    {generationStatus && (
                      <div className={`p-2 rounded-lg text-sm ${
                        generationStatus.type === 'success' 
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {generationStatus.message}
                      </div>
                    )}

                    {/* Chat Area */}
                    <ScrollArea className="h-48 border rounded-lg p-3 bg-gray-50">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-6">
                          <Heart className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">Hi! I'm your fitness assistant.</p>
                          <p className="text-xs mt-1">Use the buttons above for quick generation, or chat with me below!</p>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Ask about workout modifications</li>
                            <li>• Get exercise explanations</li>
                            <li>• Plan your fitness schedule</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] p-2 rounded-lg text-sm ${
                                  message.role === "user"
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                    : "bg-white border text-gray-800"
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ask me anything about workouts or add custom instructions..."
                        value={chatInput}
                        onChange={(e) => {
                          setChatInput(e.target.value)
                          setCustomPrompt(e.target.value) // Update custom prompt for API calls
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workout Voice-Over Section */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Workout Voice-Over</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Voice Selection */}
                    <div>
                      <Label className="text-xs">Voice Selection</Label>
                      <Select
                        value={selectedVoice}
                        onValueChange={(value) => setSelectedVoice(value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US-Neural2-F">Female Voice (US)</SelectItem>
                          <SelectItem value="en-US-Neural2-D">Male Voice (US)</SelectItem>
                          <SelectItem value="en-US-Neural2-A">Neutral Voice (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* TTS Error Display */}
                    {ttsError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <div className="flex justify-between items-center">
                          <span>{ttsError}</span>
                          <button 
                            onClick={clearTtsError}
                            className="text-red-700 hover:text-red-900"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TTS Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={handleGenerateAudio}
                        disabled={isGeneratingAudio || isSynthesizing || !currentWorkout?.content}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-md transition-colors"
                      >
                        {isGeneratingAudio || isSynthesizing ? 'Generating Audio...' : 'Generate Voice-Over'}
                      </Button>
                      
                      {audioUrl && (
                        <Button
                          onClick={handleDownloadAudio}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
                        >
                          Download Audio
                        </Button>
                      )}
                    </div>

                    {/* Audio Player */}
                    {audioUrl && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="font-medium mb-2">Audio Preview:</h3>
                        <audio controls className="w-full">
                          <source src={audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
