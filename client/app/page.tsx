"use client"

import { useState, useEffect } from "react"
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

enum DietaryPreference {
  NONE = "No Restrictions",
  VEGETARIAN = "Vegetarian",
  VEGAN = "Vegan",
  KETO = "Keto",
  PALEO = "Paleo",
  MEDITERRANEAN = "Mediterranean",
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
  dietaryPreference: DietaryPreference
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
    dietaryPreference: DietaryPreference.NONE,
    age: 25,
    workoutDuration: 45,
    workoutsPerWeek: 3,
  })

  const workoutSessions: Record<string, WorkoutSession> = {
    // Past completed workouts (Green) - Recent past dates
    "2025-01-08": {
      id: "1",
      name: "Full Body Strength",
      type: WorkoutType.STRENGTH,
      duration: 45,
      difficulty: IntensityLevel.MODERATE,
      equipment: Equipment.BASIC,
      status: WorkoutStatus.COMPLETED,
      date: "2025-01-08",
      content: `# Full Body Strength 💪

## Warm-up (5 minutes)
- **Arm circles**: 1 minute each direction
- **Leg swings**: 1 minute each leg
- **Light jogging in place**: 2 minutes

## Main Workout (35 minutes)

### Upper Body Circuit (15 minutes)
| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| **Push-ups** | 3 | 12-15 | 60s |
| **Dumbbell Rows** | 3 | 10-12 | 60s |
| **Shoulder Press** | 3 | 8-10 | 90s |

### Lower Body Circuit (15 minutes)
| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| **Squats** | 3 | 15-20 | 60s |
| **Lunges** | 3 | 12 each leg | 60s |
| **Calf Raises** | 3 | 20 | 45s |

### Core Finisher (5 minutes)
- **Plank**: 3 × 30 seconds
- **Russian Twists**: 3 × 20
- **Dead Bug**: 3 × 10 each side

## Cool Down (5 minutes)
- Full body stretching routine

---
**Calories Burned**: ~320 kcal  
**Difficulty**: ⭐⭐⭐⚪⚪  
**Status**: ✅ **COMPLETED**`,
    },
    "2025-01-10": {
      id: "2",
      name: "HIIT Cardio Blast",
      type: WorkoutType.HIIT,
      duration: 30,
      difficulty: IntensityLevel.HIGH,
      equipment: Equipment.NONE,
      status: WorkoutStatus.COMPLETED,
      date: "2025-01-10",
      content: `# HIIT Cardio Blast 🔥

## Overview
High-intensity interval training to boost cardiovascular fitness and burn calories.

## Warm-up (5 minutes)
- **Marching in place**: 2 minutes
- **Arm swings**: 1 minute
- **Light stretching**: 2 minutes

## HIIT Rounds (20 minutes)
**4 rounds × 4 exercises × 45s work / 15s rest**

### Round Structure
| Exercise | Work | Rest | Notes |
|----------|------|------|-------|
| **Burpees** | 45s | 15s | Full body explosive |
| **Mountain Climbers** | 45s | 15s | Keep core tight |
| **Jump Squats** | 45s | 15s | Land softly |
| **High Knees** | 45s | 15s | Drive knees up |

**2 minutes rest between rounds**

## Cool Down (5 minutes)
- Walking in place: 2 minutes
- Static stretches: 3 minutes

---
**Peak Heart Rate**: 85-95% max HR  
**Calories Burned**: ~280 kcal  
**Status**: ✅ **COMPLETED**`,
    },
    "2025-01-12": {
      id: "3",
      name: "Upper Body Power",
      type: WorkoutType.STRENGTH,
      duration: 40,
      difficulty: IntensityLevel.MODERATE,
      equipment: Equipment.BASIC,
      status: WorkoutStatus.COMPLETED,
      date: "2025-01-12",
      content: `# Upper Body Power 💥

## Focus
Chest, shoulders, and triceps with compound and isolation movements.

## Warm-up (5 minutes)
- **Arm circles**: 2 minutes
- **Push-up to downward dog**: 2 minutes
- **Shoulder rolls**: 1 minute

## Main Workout (30 minutes)

### Primary Movements
| Exercise | Sets | Reps | Weight |
|----------|------|------|--------|
| **Push-ups** | 4 | 12-15 | Bodyweight |
| **Pike Push-ups** | 3 | 8-10 | Bodyweight |
| **Dumbbell Press** | 4 | 10-12 | 25 lbs each |

### Secondary Work
- **Lateral Raises**: 3 × 15 (15 lbs)
- **Tricep Dips**: 3 × 12-15
- **Overhead Press**: 3 × 10 (20 lbs each)
- **Diamond Push-ups**: 2 × 8-10

## Cool Down (5 minutes)
- Chest doorway stretch
- Shoulder cross-body stretch
- Tricep overhead stretch

---
**Focus**: Upper body strength and endurance  
**Status**: ✅ **COMPLETED**`,
    },

    // Rest days (Yellow)
    "2025-01-09": {
      id: "4",
      name: "Active Recovery",
      type: WorkoutType.YOGA,
      duration: 20,
      difficulty: IntensityLevel.LOW,
      equipment: Equipment.BASIC,
      status: WorkoutStatus.REST,
      date: "2025-01-09",
      content: `# Active Recovery Day 🧘‍♀️

## Purpose
Gentle movement to promote recovery and maintain mobility.

## Light Movement (20 minutes)

### Gentle Flow (15 minutes)
- **Child's Pose**: 2 minutes
- **Cat-Cow stretches**: 3 minutes
- **Gentle spinal twists**: 3 minutes
- **Hip circles**: 2 minutes
- **Shoulder rolls**: 2 minutes
- **Deep breathing**: 3 minutes

### Optional Activities
- **Easy walk**: 10-15 minutes
- **Light stretching**: As needed
- **Foam rolling**: 5-10 minutes

## Recovery Focus
- **Hydration**: 2.5+ liters of water
- **Sleep**: Aim for 8+ hours
- **Nutrition**: Anti-inflammatory foods

---
**Activity Level**: Very light  
**Benefits**: Recovery and flexibility  
**Status**: 😴 **REST DAY**`,
    },
    "2025-01-11": {
      id: "5",
      name: "Rest & Mobility",
      type: WorkoutType.YOGA,
      duration: 15,
      difficulty: IntensityLevel.LOW,
      equipment: Equipment.NONE,
      status: WorkoutStatus.REST,
      date: "2025-01-11",
      content: `# Rest & Mobility Day 🌱

## Recovery Focus
Today is about gentle movement and mental relaxation.

## Mobility Routine (15 minutes)

### Upper Body (5 minutes)
- **Neck stretches**: 1 minute each direction
- **Shoulder shrugs**: 1 minute
- **Arm circles**: 2 minutes

### Lower Body (5 minutes)
- **Hip circles**: 2 minutes
- **Leg swings**: 2 minutes
- **Ankle rolls**: 1 minute

### Core & Spine (5 minutes)
- **Gentle spinal twists**: 3 minutes
- **Cat-cow stretches**: 2 minutes

## Wellness Activities
- **Meditation**: 10-15 minutes
- **Reading**: Relaxation time
- **Nature walk**: If weather permits

---
**Intensity**: Minimal  
**Focus**: Recovery and mental health  
**Status**: 😴 **REST DAY**`,
    },
    "2025-01-13": {
      id: "6",
      name: "Complete Rest",
      type: WorkoutType.YOGA,
      duration: 0,
      difficulty: IntensityLevel.LOW,
      equipment: Equipment.NONE,
      status: WorkoutStatus.REST,
      date: "2025-01-13",
      content: `# Complete Rest Day 😴

## Why Complete Rest?
After intense training, your body needs time to repair and grow stronger.

## Rest Day Benefits
- **Muscle repair** and growth
- **Nervous system** recovery
- **Mental** recharge
- **Injury prevention**
- **Hormone balance**

## Optional Light Activities
Choose only if you feel energetic:

### Gentle Options (10-15 minutes max)
- **Easy walk** in fresh air
- **Light stretching** routine
- **Deep breathing** exercises
- **Meditation** or mindfulness

## Recovery Checklist
- ✅ **Sleep**: 8+ hours of quality sleep
- ✅ **Hydration**: 3+ liters of water
- ✅ **Nutrition**: Protein-rich, anti-inflammatory foods
- ✅ **Stress management**: Relaxation techniques

## Tomorrow's Preview
Get ready for an exciting **CrossFit workout** tomorrow!

---
**Activity Level**: None to minimal  
**Focus**: Complete recovery  
**Status**: 😴 **COMPLETE REST**

> 💚 **Remember: Rest days are when the magic happens - your body gets stronger!**`,
    },

    // Upcoming planned workouts (Blue)
    "2025-01-15": {
      id: "7",
      name: "CrossFit WOD: Cindy",
      type: WorkoutType.CROSSFIT,
      duration: 25,
      difficulty: IntensityLevel.HIGH,
      equipment: Equipment.BASIC,
      status: WorkoutStatus.PLANNED,
      date: "2025-01-15",
      content: `# CrossFit WOD: "Cindy" 🏋️‍♀️

## The Workout
**AMRAP 20** (As Many Rounds As Possible in 20 minutes)
- **5 Pull-ups** (or assisted)
- **10 Push-ups**
- **15 Air Squats**

## Warm-up (5 minutes)
- **Row or jump rope**: 3 minutes
- **Dynamic stretching**: 2 minutes
- **Movement practice**: Light versions of workout movements

## Strategy Tips
1. **Pace yourself** - aim for consistent rounds
2. **Break up reps** if needed (e.g., 3+2 pull-ups)
3. **Breathe** during transitions
4. **Track your rounds** + additional reps

## Scaling Options

### Beginner
- **Pull-ups**: Assisted or ring rows
- **Push-ups**: Knee push-ups or incline
- **Air Squats**: Chair-assisted if needed

### Intermediate (RX)
- All movements as prescribed
- Focus on consistent pace

### Advanced
- **Pull-ups**: Chest-to-bar
- **Push-ups**: Handstand push-ups
- **Air Squats**: Jump squats

## Target Scores
- **Beginner**: 8-12 rounds
- **Intermediate**: 12-16 rounds
- **Advanced**: 16-20+ rounds

---
**Intensity**: Very High  
**Focus**: Muscular endurance  
**Status**: 📅 **SCHEDULED**

> 🔥 **"Cindy" is a classic benchmark WOD - give it everything you've got!**`,
    },
    "2025-01-17": {
      id: "8",
      name: "5K Run Training",
      type: WorkoutType.RUNNING,
      duration: 35,
      difficulty: IntensityLevel.MODERATE,
      equipment: Equipment.NONE,
      status: WorkoutStatus.PLANNED,
      date: "2025-01-17",
      content: `# 5K Run Training 🏃‍♀️

## Training Goal
Build endurance and improve 5K pace with structured intervals.

## Pre-Run (5 minutes)
- **Light walking**: 2 minutes
- **Dynamic warm-up**: 3 minutes
  - Leg swings, high knees, butt kicks
  - Ankle circles, calf raises

## Main Run (25 minutes)

### Interval Structure
| Phase | Duration | Intensity | Pace |
|-------|----------|-----------|------|
| **Warm-up Run** | 5 min | Easy | Conversational |
| **Interval 1** | 3 min | Hard | 5K pace |
| **Recovery** | 2 min | Easy | Slow jog |
| **Interval 2** | 3 min | Hard | 5K pace |
| **Recovery** | 2 min | Easy | Slow jog |
| **Interval 3** | 3 min | Hard | 5K pace |
| **Cool-down** | 7 min | Easy | Conversational |

## Running Form Focus
- **Posture**: Tall spine, slight forward lean
- **Cadence**: ~180 steps per minute
- **Foot strike**: Midfoot landing
- **Arms**: Relaxed, 90-degree angle

## Post-Run (5 minutes)
- **Cool-down walk**: 2 minutes
- **Stretching**: 3 minutes
  - Calf, quad, hamstring, hip flexor

---
**Target Heart Rate**: 70-85% max HR  
**Calories**: ~300-350 kcal  
**Status**: 📅 **SCHEDULED**`,
    },
    "2025-01-19": {
      id: "9",
      name: "Lower Body Strength",
      type: WorkoutType.STRENGTH,
      duration: 45,
      difficulty: IntensityLevel.HIGH,
      equipment: Equipment.BASIC,
      status: WorkoutStatus.PLANNED,
      date: "2025-01-19",
      content: `# Lower Body Strength 🦵

## Focus
Comprehensive leg and glute workout for strength and power.

## Warm-up (8 minutes)
- **Dynamic leg swings**: 2 minutes
- **Bodyweight squats**: 2 minutes
- **Walking lunges**: 2 minutes
- **Calf raises**: 2 minutes

## Main Workout (32 minutes)

### Compound Movements (20 minutes)
| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| **Goblet Squats** | 4 | 12-15 | 90s |
| **Romanian Deadlifts** | 4 | 10-12 | 90s |
| **Bulgarian Split Squats** | 3 | 10 each leg | 60s |

### Isolation Work (12 minutes)
- **Single-leg Glute Bridges**: 3 × 12 each leg
- **Wall Sit**: 3 × 45 seconds
- **Calf Raises**: 3 × 20
- **Lateral Lunges**: 3 × 10 each side

## Finisher Circuit (3 minutes)
- **Jump Squats**: 30 seconds
- **Rest**: 30 seconds
- **Repeat 3 times**

## Cool Down (5 minutes)
- Quad stretch, hamstring stretch
- Hip flexor stretch, calf stretch
- Glute stretch

---
**Focus**: Lower body strength and power  
**Difficulty**: ⭐⭐⭐⭐⚪  
**Status**: 📅 **SCHEDULED**`,
    },
    "2025-01-21": {
      id: "10",
      name: "HIIT Tabata Circuit",
      type: WorkoutType.HIIT,
      duration: 20,
      difficulty: IntensityLevel.EXTREME,
      equipment: Equipment.NONE,
      status: WorkoutStatus.PLANNED,
      date: "2025-01-21",
      content: `# HIIT Tabata Circuit ⚡

## Protocol
**Tabata Format**: 20 seconds all-out work / 10 seconds rest
**4 exercises × 8 rounds each = 16 minutes total**

## Circuit Breakdown

### Round 1: Burpees (4 minutes)
- **Work**: 20 seconds maximum burpees
- **Rest**: 10 seconds active recovery
- **Repeat**: 8 times

### Round 2: Mountain Climbers (4 minutes)
- **Work**: 20 seconds fast mountain climbers
- **Rest**: 10 seconds hold plank
- **Repeat**: 8 times

### Round 3: Jump Squats (4 minutes)
- **Work**: 20 seconds explosive jump squats
- **Rest**: 10 seconds bodyweight squats
- **Repeat**: 8 times

### Round 4: High Knees (4 minutes)
- **Work**: 20 seconds maximum high knees
- **Rest**: 10 seconds marching in place
- **Repeat**: 8 times

## Intensity Guidelines
- **Work Phase**: 95-100% maximum effort
- **Rest Phase**: Keep moving, don't stop completely
- **Between Rounds**: 1 minute active recovery

## Expected Results
- **Heart Rate**: 85-95% max during work phases
- **Calories**: ~200-250 kcal
- **EPOC**: Elevated metabolism for 12+ hours post-workout

---
**Total Time**: 20 minutes  
**Difficulty**: ⭐⭐⭐⭐⭐  
**Status**: 📅 **SCHEDULED**

> 🔥 **Tabata is scientifically proven to improve both aerobic and anaerobic capacity in just 4 minutes per exercise!**`,
    },
  }

  useEffect(() => {
    // Load workout for selected date with proper error handling
    const dateKey = selectedDate.toISOString().split("T")[0]
    const workout = workoutSessions[dateKey] || null
    setCurrentWorkout(workout)

    // Debug log to verify data loading
    console.log(`Selected date: ${dateKey}, Workout found:`, workout ? workout.name : "None")
  }, [selectedDate])

  const getDateStatus = (date: Date): WorkoutStatus => {
    const dateKey = date.toISOString().split("T")[0]
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you want to ${chatInput}. Based on your current preferences (${userPreferences.fitnessGoal}, ${userPreferences.experienceLevel} level), I can help you adjust your workout plan. Would you like me to modify today's workout or update your preferences?`,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiResponse])
    }, 1000)

    setChatInput("")
  }

  const AuthDialog = ({ type }: { type: "login" | "register" }) => (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-center">{type === "login" ? "Welcome Back" : "Join FlexFit"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="your@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>
        {type === "register" && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Your Name" />
          </div>
        )}
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => setIsAuthenticated(true)}
        >
          {type === "login" ? "Sign In" : "Create Account"}
        </Button>
      </div>
    </DialogContent>
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute top-4 left-4 flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
                Login
              </Button>
            </DialogTrigger>
            <AuthDialog type="login" />
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Register
              </Button>
            </DialogTrigger>
            <AuthDialog type="register" />
          </Dialog>
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
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Button variant="outline" onClick={() => setIsAuthenticated(false)} className="bg-white/80">
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
                        const workout = workoutSessions[date.toISOString().split("T")[0]]
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
                                <div className="overflow-x-auto my-6 shadow-sm rounded-lg border border-gray-200">
                                  <table className="min-w-full bg-white divide-y divide-gray-200">{children}</table>
                                </div>
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

                      <div>
                        <Label className="text-xs">Dietary Preference</Label>
                        <Select
                          value={userPreferences.dietaryPreference}
                          onValueChange={(value) =>
                            setUserPreferences((prev) => ({
                              ...prev,
                              dietaryPreference: value as DietaryPreference,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(DietaryPreference).map((diet) => (
                              <SelectItem key={diet} value={diet}>
                                {diet}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* AI Chat Interface */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>AI Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScrollArea className="h-64 border rounded-lg p-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">Hi! I'm your fitness AI assistant.</p>
                          <p className="text-xs mt-1">Ask me to:</p>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Generate new workouts</li>
                            <li>• Modify existing sessions</li>
                            <li>• Update your preferences</li>
                            <li>• Plan your weekly schedule</li>
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
                                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                  message.role === "user"
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ask me about workouts or preferences..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
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
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
