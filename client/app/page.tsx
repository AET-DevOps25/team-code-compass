"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, Flame, SpaceIcon as Yoga, MonitorIcon as Running } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sportTypes } from "@/lib/data"
import ChatbotInterface from "@/components/chatbot-interface"

export default function LandingPage() {
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [gender, setGender] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [weight, setWeight] = useState<string>("")
  const router = useRouter()

  const handleSelectSport = (sportId: string) => {
    setSelectedSport(sportId)
  }

  const handleContinue = () => {
    if (selectedSport) {
      // In a real app, we would save this to state/context/localStorage
      localStorage.setItem("selectedSport", selectedSport)

      // Save user information
      if (gender) localStorage.setItem("userGender", gender)
      if (height) localStorage.setItem("userHeight", height)
      if (weight) localStorage.setItem("userWeight", weight)

      router.push("/workout-plan")
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Dumbbell":
        return <Dumbbell className="h-8 w-8" />
      case "Flame":
        return <Flame className="h-8 w-8" />
      case "Yoga":
        return <Yoga className="h-8 w-8" />
      case "Running":
        return <Running className="h-8 w-8" />
      default:
        return <Dumbbell className="h-8 w-8" />
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-8 flex items-center justify-center">
        <div className="relative w-16 h-16 md:w-24 md:h-24 bg-primary rounded-full flex items-center justify-center">
          <span className="text-2xl md:text-4xl font-bold text-primary-foreground">F</span>
        </div>
      </div>

      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">Welcome to FlexFit</h1>

      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 text-center">
        Your personalized 7-day workout plan designed to help you achieve your fitness goals. Get started today and
        transform your fitness journey.
      </p>

      {/* Add the chatbot interface as the main visual element */}
      <div className="w-full max-w-2xl mb-12">
        <ChatbotInterface />
      </div>

      {/* Workout Type Selection */}
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Choose Your Sport Type</h2>
          <p className="text-muted-foreground">Select the type of workout that best fits your fitness goals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sportTypes.map((sport) => (
            <Card
              key={sport.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSport === sport.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectSport(sport.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  {getIcon(sport.icon)}
                  <CardTitle>{sport.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{sport.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Information Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Help us personalize your workout plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Enter your height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Enter your weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button size="lg" onClick={handleContinue} disabled={!selectedSport} className="text-lg px-8 py-6">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
