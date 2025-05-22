"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { workoutPlans } from "@/lib/data"

export default function WorkoutPlanPage() {
  const [selectedSport, setSelectedSport] = useState<string>("strength")
  const [selectedDay, setSelectedDay] = useState<string>("1")
  const router = useRouter()

  useEffect(() => {
    // In a real app, we would get this from state/context
    const storedSport = localStorage.getItem("selectedSport")
    if (storedSport) {
      setSelectedSport(storedSport)
    }
  }, [])

  const workoutPlan = workoutPlans[selectedSport as keyof typeof workoutPlans]

  const startWorkout = () => {
    // Store the selected day for the workout session
    localStorage.setItem("selectedDay", selectedDay)
    router.push("/workout-session")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{workoutPlan.name}</h1>
        <p className="text-muted-foreground">Your personalized 7-day workout plan</p>
      </div>

      <Tabs defaultValue="1" value={selectedDay} onValueChange={setSelectedDay}>
        <TabsList className="grid grid-cols-7 mb-8">
          {workoutPlan.days.map((day) => (
            <TabsTrigger key={day.day} value={day.day.toString()}>
              Day {day.day}
            </TabsTrigger>
          ))}
        </TabsList>

        {workoutPlan.days.map((day) => (
          <TabsContent key={day.day} value={day.day.toString()}>
            <Card>
              <CardHeader>
                <CardTitle>
                  Day {day.day}: {day.name}
                </CardTitle>
                <CardDescription>Complete all exercises in order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {day.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="flex items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{exercise.name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {exercise.sets && exercise.reps && (
                            <span>
                              {exercise.sets} sets × {exercise.reps} reps
                            </span>
                          )}
                          {exercise.duration && <span>{exercise.duration}</span>}
                          {exercise.description && <span> • {exercise.description}</span>}
                          {exercise.rest && <span> • Rest: {exercise.rest}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={startWorkout}>
                Start Workout
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
