import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { DailyWorkout, ScheduledExercise, SportType } from '@/types'

interface CalendarSidebarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

// Mock workout data for demonstration
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
    rpe_overall_feedback: 7,
    cadence_metrics: 'Good pace',
    completion_notes: 'Felt strong today'
  }
}

const mockExercises: Record<string, ScheduledExercise[]> = {
  '1': [
    {
      id: 'ex1',
      daily_workout_id: '1',
      sequence_order: 1,
      exercise_name: 'Push-ups',
      description: 'Standard push-ups for upper body strength',
      applicable_sport_types: [SportType.STRENGTH],
      muscle_groups_primary: ['Chest', 'Triceps'],
      muscle_groups_secondary: ['Shoulders', 'Core'],
      equipment_needed: [],
      difficulty: 'Beginner',
      prescribed_sets_reps_duration: '3 sets of 10 reps',
      voice_script_cue_text: 'Lower your body until your chest nearly touches the floor',
      video_url: '',
      rpe_feedback: undefined,
      completion_status: 'planned'
    },
    {
      id: 'ex2',
      daily_workout_id: '1',
      sequence_order: 2,
      exercise_name: 'Squats',
      description: 'Bodyweight squats for leg strength',
      applicable_sport_types: [SportType.STRENGTH],
      muscle_groups_primary: ['Quadriceps', 'Glutes'],
      muscle_groups_secondary: ['Hamstrings', 'Core'],
      equipment_needed: [],
      difficulty: 'Beginner',
      prescribed_sets_reps_duration: '3 sets of 15 reps',
      voice_script_cue_text: 'Keep your chest up and push through your heels',
      video_url: '',
      rpe_feedback: undefined,
      completion_status: 'planned'
    }
  ]
}

export function CalendarSidebar({ selectedDate, onDateSelect }: CalendarSidebarProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const generateCalendarDays = () => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = formatDateKey(date)
      const hasWorkout = mockWorkouts[dateKey]
      
      days.push({
        date,
        day,
        dateKey,
        hasWorkout,
        isSelected: formatDateKey(date) === formatDateKey(selectedDate)
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

  const days = generateCalendarDays()

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-4 gap-2">
          {days.map(({ date, day, dateKey, hasWorkout, isSelected }) => (
            <div key={day} className="relative">
              <Button
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={`w-full h-10 text-sm relative ${
                  hasWorkout 
                    ? 'border-2 border-yellow-400' 
                    : ''
                } ${
                  isSelected 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => handleDateClick(date, dateKey)}
              >
                {day}
                {hasWorkout && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                )}
              </Button>
              
              {/* Exercise Details Dropdown */}
              {expandedDate === dateKey && hasWorkout && (
                <div className="absolute top-12 left-0 right-0 z-10">
                  <Card className="bg-white/95 text-gray-800 border border-gray-200 shadow-lg">
                    <CardContent className="p-3 text-xs">
                      <div className="font-semibold mb-2">
                        {hasWorkout.focus_sport_type_for_the_day} Workout
                      </div>
                      <div className="space-y-1">
                        <div>Status: {hasWorkout.completion_status}</div>
                        {hasWorkout.rpe_overall_feedback && (
                          <div>RPE: {hasWorkout.rpe_overall_feedback}/10</div>
                        )}
                      </div>
                      
                      {mockExercises[hasWorkout.id] && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="font-medium mb-1">Exercises:</div>
                          {mockExercises[hasWorkout.id].map((exercise, idx) => (
                            <div key={exercise.id} className="text-xs">
                              {idx + 1}. {exercise.exercise_name} - {exercise.prescribed_sets_reps_duration}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Helper Text */}
        <div className="text-xs text-white/70 mt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span>Workout scheduled</span>
          </div>
          <div>Click any day to view exercise details</div>
        </div>
      </CardContent>
    </Card>
  )
} 