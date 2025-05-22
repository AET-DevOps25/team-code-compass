"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { progressData } from "@/lib/data"

export default function ProgressPage() {
  const { weeklyVolume, averageRPE, weeklyWorkouts, streaks } = progressData

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground">Track your fitness journey over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{streaks.current} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{streaks.longest} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Workouts This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{streaks.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="volume">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="rpe">Average RPE</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
        </TabsList>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Training Volume</CardTitle>
              <CardDescription>Total volume (sets × reps × weight) per week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  volume: {
                    label: "Volume",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="volume" stroke="var(--color-volume)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rpe">
          <Card>
            <CardHeader>
              <CardTitle>Average RPE</CardTitle>
              <CardDescription>Rate of Perceived Exertion (1-10 scale)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  rpe: {
                    label: "RPE",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={averageRPE}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 10]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="rpe" stroke="var(--color-rpe)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Workouts</CardTitle>
              <CardDescription>Number of workouts completed each week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  workouts: {
                    label: "Workouts",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyWorkouts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 7]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="workouts" fill="var(--color-workouts)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
