import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Clock, Target } from 'lucide-react'
import { DailyWorkout, ScheduledExercise, SportType } from '@/types'

interface CalendarSectionProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

// Mock workout data with more variety
const mockWorkouts: Record<string, DailyWorkout> = {
  '2024-01-15': {
    id: '1',
    user_id: 'user1',
    day_date: new Date('2024-01-15'),
    focus_sport_type_for_the_day: 'STRENGTH',
    completion_status: 'planned',
    rpe_overall_feedback: undefined,
    cadence_metrics: undefined,
    completion_notes: undefined
  },
  '2024-01-16': {
    id: '2',
    user_id: 'user1',
    day_date: new Date('2024-01-16'),
    focus_sport_type_for_the_day: 'HIIT',
    completion_status: 'completed',
    rpe_overall_feedback: 8,
    cadence_metrics: 'High intensity',
    completion_notes: 'Great session!'
  },
  '2024-01-18': {
    id: '3',
    user_id: 'user1',
    day_date: new Date('2024-01-18'),
    focus_sport_type_for_the_day: 'YOGA_MOBILITY',
    completion_status: 'planned',
    rpe_overall_feedback: undefined,
    cadence_metrics: undefined,
    completion_notes: undefined
  },
  '2024-01-20': {
    id: '4',
    user_id: 'user1',
    day_date: new Date('2024-01-20'),
    focus_sport_type_for_the_day: 'RUNNING_INTERVALS',
    completion_status: 'planned',
    rpe_overall_feedback: undefined,
    cadence_metrics: undefined,
    completion_notes: undefined
  }
}

const mockExercises: Record<string, ScheduledExercise[]> = {
  '1': [
    {
      id: 'ex1',
      daily_workout_id: '1',
      sequence_order: 1,
      exercise_name: 'Barbell Squats',
      description: 'Compound leg exercise for strength building',
      applicable_sport_types: [SportType.STRENGTH],
      muscle_groups_primary: ['Quadriceps', 'Glutes'],
      muscle_groups_secondary: ['Hamstrings', 'Core'],
      equipment_needed: [],
      difficulty: 'Intermediate',
      prescribed_sets_reps_duration: '4 sets of 8-10 reps',
      voice_script_cue_text: 'Keep your chest up and drive through your heels',
      video_url: '',
      rpe_feedback: undefined,
      completion_status: 'planned'
    },
    {
      id: 'ex2',
      daily_workout_id: '1',
      sequence_order: 2,
      exercise_name: 'Bench Press',
      description: 'Upper body strength exercise',
      applicable_sport_types: [SportType.STRENGTH],
      muscle_groups_primary: ['Chest', 'Triceps'],
      muscle_groups_secondary: ['Shoulders', 'Core'],
      equipment_needed: [],
      difficulty: 'Intermediate',
      prescribed_sets_reps_duration: '4 sets of 6-8 reps',
      voice_script_cue_text: 'Control the weight and focus on form',
      video_url: '',
      rpe_feedback: undefined,
      completion_status: 'planned'
    }
  ],
  '2': [
    {
      id: 'ex3',
      daily_workout_id: '2',
      sequence_order: 1,
      exercise_name: 'Burpees',
      description: 'Full-body HIIT exercise',
      applicable_sport_types: [SportType.HIIT],
      muscle_groups_primary: ['Full Body'],
      muscle_groups_secondary: [],
      equipment_needed: [],
      difficulty: 'Advanced',
      prescribed_sets_reps_duration: '5 rounds of 10 reps',
      voice_script_cue_text: 'Maintain intensity and push your limits',
      video_url: '',
      rpe_feedback: 8,
      completion_status: 'completed'
    }
  ]
}

const getSportTypeColor = (sportType: string) => {
  switch (sportType) {
    case 'STRENGTH':
      return 'bg-red-500/80 text-white'
    case 'HIIT':
      return 'bg-orange-500/80 text-white'
    case 'YOGA_MOBILITY':
      return 'bg-green-500/80 text-white'
    case 'RUNNING_INTERVALS':
      return 'bg-blue-500/80 text-white'
    default:
      return 'bg-gray-500/80 text-white'
  }
}

const getSportTypeIcon = (sportType: string) => {
  switch (sportType) {
    case 'STRENGTH':
      return <Dumbbell className="w-3 h-3" />
    case 'HIIT':
      return <Target className="w-3 h-3" />
    case 'YOGA_MOBILITY':
      return <div className="w-3 h-3 rounded-full bg-current" />
    case 'RUNNING_INTERVALS':
      return <div className="w-3 h-3 rounded bg-current" />
    default:
      return <Clock className="w-3 h-3" />
  }
}

export function CalendarSection({ selectedDate, onDateSelect }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setFullYear(newDate.getFullYear() - 1)
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1)
    }
    setCurrentDate(newDate)
  }

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = formatDateKey(date)
      const hasWorkout = mockWorkouts[dateKey]
      
      days.push({
        date,
        day,
        dateKey,
        hasWorkout,
        isSelected: formatDateKey(date) === formatDateKey(selectedDate),
        isToday: formatDateKey(date) === formatDateKey(new Date())
      })
    }
    
    return days
  }

  const handleDateClick = (date: Date, dateKey: string) => {
    onDateSelect(date)
    
    if (expandedDate === dateKey) {
      setExpandedDate(null)
    } else {
      setExpandedDate(dateKey)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = generateCalendarDays()

  return (
    <div className="h-full flex flex-col">
      {/* Header with Navigation */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Workout Calendar</h2>
          </div>
          
          {/* Year Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateYear('prev')}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white font-semibold min-w-[80px] text-center">
              {currentDate.getFullYear()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateYear('next')}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-xl font-semibold text-white min-w-[120px] text-center">
            {monthNames[currentDate.getMonth()]}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-white/70 font-medium text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-fr gap-2 mb-6 min-h-[400px]">
          {days.map((dayData, index) => (
            <div key={index} className="relative min-h-[60px]">
              {dayData ? (
                <div className="h-full">
                  <Button
                    variant={dayData.isSelected ? "default" : "ghost"}
                    className={`w-full h-full p-2 relative flex flex-col items-center justify-center min-h-[60px] ${
                      dayData.hasWorkout 
                        ? 'border-2 border-yellow-400/60 bg-white/10' 
                        : 'hover:bg-white/5'
                    } ${
                      dayData.isSelected 
                        ? 'bg-white text-gray-900 hover:bg-white/90' 
                        : 'text-white'
                    } ${
                      dayData.isToday && !dayData.isSelected
                        ? 'ring-2 ring-blue-400'
                        : ''
                    }`}
                    onClick={() => handleDateClick(dayData.date, dayData.dateKey)}
                  >
                    <span className="text-sm font-medium">{dayData.day}</span>
                    {dayData.hasWorkout && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getSportTypeColor(dayData.hasWorkout.focus_sport_type_for_the_day)}`}></div>
                      </div>
                    )}
                  </Button>
                  
                  {/* Expanded Workout Details */}
                  {expandedDate === dayData.dateKey && dayData.hasWorkout && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2">
                      <Card className="bg-white/95 backdrop-blur-sm text-gray-800 border border-gray-200 shadow-xl">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            {getSportTypeIcon(dayData.hasWorkout.focus_sport_type_for_the_day)}
                            {dayData.hasWorkout.focus_sport_type_for_the_day.replace('_', ' ')} Workout
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {dayData.hasWorkout.completion_status}
                            </Badge>
                            {dayData.hasWorkout.rpe_overall_feedback && (
                              <Badge variant="outline" className="text-xs">
                                RPE: {dayData.hasWorkout.rpe_overall_feedback}/10
                              </Badge>
                            )}
                          </div>
                          
                          {mockExercises[dayData.hasWorkout.id] && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs text-gray-600">Exercises:</h4>
                              {mockExercises[dayData.hasWorkout.id].map((exercise) => (
                                <div key={exercise.id} className="p-2 bg-gray-50 rounded text-xs">
                                  <div className="font-medium">{exercise.exercise_name}</div>
                                  <div className="text-gray-600">{exercise.prescribed_sets_reps_duration}</div>
                                  <div className="flex gap-1 mt-1">
                                    {exercise.muscle_groups_primary.map((muscle) => (
                                      <Badge key={muscle} variant="outline" className="text-xs px-1 py-0">
                                        {muscle}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-[60px]"></div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/80 rounded-full"></div>
            <span>Strength</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500/80 rounded-full"></div>
            <span>HIIT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/80 rounded-full"></div>
            <span>Yoga/Mobility</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500/80 rounded-full"></div>
            <span>Running</span>
          </div>
        </div>
      </div>
    </div>
  )
} 