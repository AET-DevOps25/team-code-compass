"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function FeedbackPage() {
  const [rpe, setRpe] = useState(5)
  const [enjoyment, setEnjoyment] = useState("neutral")
  const router = useRouter()

  const handleSubmit = () => {
    // In a real app, we would save this feedback
    console.log({ rpe, enjoyment })
    router.push("/progress")
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-muted-foreground">How was your workout today?</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Your Workout</CardTitle>
          <CardDescription>This helps us track your progress and adjust your plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label htmlFor="rpe">Rate of Perceived Exertion (RPE)</Label>
              <span className="font-medium">{rpe}/10</span>
            </div>
            <Slider
              id="rpe"
              min={1}
              max={10}
              step={1}
              value={[rpe]}
              onValueChange={(value) => setRpe(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Easy</span>
              <span>Moderate</span>
              <span>Hard</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label>How did you enjoy this workout?</Label>
            <RadioGroup value={enjoyment} onValueChange={setEnjoyment}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="loved" id="loved" />
                <Label htmlFor="loved">Loved it!</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="liked" id="liked" />
                <Label htmlFor="liked">Liked it</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral">It was okay</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disliked" id="disliked" />
                <Label htmlFor="disliked">Didn't enjoy it</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full">
            Submit Feedback
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
