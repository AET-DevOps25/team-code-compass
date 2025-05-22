"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Volume2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { workoutPlans } from "@/lib/data"

export default function WorkoutSessionPage() {
  const [selectedSport, setSelectedSport] = useState<string>("strength")
  const [selectedDay, setSelectedDay] = useState<string>("1")
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // In a real app, we would get this from state/context
    const storedSport = localStorage.getItem("selectedSport")
    const storedDay = localStorage.getItem("selectedDay")

    if (storedSport) {
      setSelectedSport(storedSport)
    }

    if (storedDay) {
      setSelectedDay(storedDay)
    }
  }, [])

  const workoutPlan = workoutPlans[selectedSport as keyof typeof workoutPlans]
  const dayPlan = workoutPlan?.days.find((day) => day.day.toString() === selectedDay)
  const exercises = dayPlan?.exercises || []
  const currentExercise = exercises[currentExerciseIndex]
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setIsPlaying(false)
    } else {
      // Workout complete, navigate to feedback
      router.push("/feedback")
    }
  }

  const playVoiceGuidance = () => {
    setIsPlaying(true)
    // In a real app, this would trigger audio playback
    setTimeout(() => {
      setIsPlaying(false)
    }, 3000)
  }

  if (!dayPlan || !currentExercise) {
    return <div>Loading workout...</div>
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center mb-2">{dayPlan.name}</h1>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{currentExercise.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold mb-2">
            {currentExercise.sets && currentExercise.reps && (
              <span>
                {currentExercise.sets} × {currentExercise.reps}
              </span>
            )}
            {currentExercise.duration && <span>{currentExercise.duration}</span>}
          </div>
          {currentExercise.description && <p className="text-muted-foreground">{currentExercise.description}</p>}
          {currentExercise.rest && <p className="text-muted-foreground mt-2">Rest: {currentExercise.rest}</p>}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" size="icon" onClick={playVoiceGuidance} disabled={isPlaying}>
            <Volume2 className="h-5 w-5" />
          </Button>
          <Button onClick={handleNext}>
            {currentExerciseIndex < exercises.length - 1 ? (
              <>
                Next Exercise <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Complete Workout"
            )}
          </Button>
        </CardFooter>
      </Card>

      {isPlaying && (
        <div className="bg-muted p-3 rounded-lg text-center animate-pulse">
          <p>Playing voice guidance...</p>
        </div>
      )}
    </div>
  )
}
