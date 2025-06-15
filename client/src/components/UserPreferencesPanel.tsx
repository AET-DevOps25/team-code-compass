import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { User, Settings, Heart, Dumbbell, Target, Zap } from 'lucide-react'
import {
  ExperienceLevel,
  FitnessGoal,
  SportType,
  IntensityPreference,
  UserPreferences
} from '@/types'

export function UserPreferencesPanel() {
  const [userInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'Active',
    avatar: '',
    level: 'Intermediate'
  })

  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    experience_level: ExperienceLevel.INTERMEDIATE,
    fitness_goals: [FitnessGoal.MUSCLE_GAIN, FitnessGoal.STRENGTH_GAIN],
    preferred_sport_types: [SportType.STRENGTH, SportType.HIIT],
    intensity_preference: IntensityPreference.MODERATE_HIGH,
    workout_duration_range: '45-60 minutes'
  })

  const [isEditMode, setIsEditMode] = useState(false)

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleFitnessGoal = (goal: FitnessGoal) => {
    const currentGoals = preferences.fitness_goals || []
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal]
    
    handlePreferenceChange('fitness_goals', updatedGoals)
  }

  const toggleSportType = (sport: SportType) => {
    const currentSports = preferences.preferred_sport_types || []
    const updatedSports = currentSports.includes(sport)
      ? currentSports.filter(s => s !== sport)
      : [...currentSports, sport]
    
    handlePreferenceChange('preferred_sport_types', updatedSports)
  }

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-white text-lg">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="text-white hover:bg-white/20 p-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Compact User Info */}
        <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl border border-white/10">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {userInfo.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{userInfo.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-green-600 text-white text-xs px-2 py-0.5">
                <Heart className="w-3 h-3 mr-1" />
                {userInfo.status}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white text-xs px-2 py-0.5">
                {userInfo.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-sm">12</div>
            <div className="text-white/60 text-xs">Workouts</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-sm">8.2</div>
            <div className="text-white/60 text-xs">Avg RPE</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-sm">45m</div>
            <div className="text-white/60 text-xs">Duration</div>
          </div>
        </div>

        {/* Compact Preferences */}
        {isEditMode ? (
          <div className="space-y-3">
            {/* Experience Level */}
            <div className="space-y-1">
              <label className="text-white text-xs font-medium">Experience</label>
              <Select
                value={preferences.experience_level}
                onValueChange={(value) => handlePreferenceChange('experience_level', value as ExperienceLevel)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs h-8">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExperienceLevel).map((level) => (
                    <SelectItem key={level} value={level} className="text-xs">
                      {level.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Sports - Compact */}
            <div className="space-y-1">
              <label className="text-white text-xs font-medium flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                Sports
              </label>
              <div className="grid grid-cols-2 gap-1">
                {Object.values(SportType).map((sport) => (
                  <Button
                    key={sport}
                    variant={preferences.preferred_sport_types?.includes(sport) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSportType(sport)}
                    className={`text-xs h-7 ${
                      preferences.preferred_sport_types?.includes(sport)
                        ? 'bg-white text-blue-600'
                        : 'border-white/40 text-white hover:bg-white/20'
                    }`}
                  >
                    {sport === 'HIIT' ? 'HIIT' : sport.split('_')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Primary Goals - Toggle */}
            <div className="space-y-1">
              <label className="text-white text-xs font-medium flex items-center gap-1">
                <Target className="w-3 h-3" />
                Goals
              </label>
              <div className="space-y-1">
                {[FitnessGoal.WEIGHT_LOSS, FitnessGoal.MUSCLE_GAIN, FitnessGoal.STRENGTH_GAIN].map((goal) => (
                  <div key={goal} className="flex items-center justify-between">
                    <span className="text-white text-xs">
                      {goal.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <Switch
                      checked={preferences.fitness_goals?.includes(goal) || false}
                      onCheckedChange={() => toggleFitnessGoal(goal)}
                      className="scale-75"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div className="space-y-1">
              <label className="text-white text-xs font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Intensity
              </label>
              <Select
                value={preferences.intensity_preference}
                onValueChange={(value) => handlePreferenceChange('intensity_preference', value as IntensityPreference)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs h-8">
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IntensityPreference).map((intensity) => (
                    <SelectItem key={intensity} value={intensity} className="text-xs">
                      {intensity.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button 
              className="w-full bg-white text-blue-600 hover:bg-white/90 h-8 text-xs"
              onClick={() => {
                setIsEditMode(false)
                console.log('Saved preferences:', preferences)
              }}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current Preferences Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Experience</span>
                <span className="text-white text-xs">
                  {preferences.experience_level?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Intensity</span>
                <span className="text-white text-xs">
                  {preferences.intensity_preference?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Duration</span>
                <span className="text-white text-xs">{preferences.workout_duration_range}</span>
              </div>
            </div>

            {/* Active Goals */}
            <div>
              <div className="text-white/70 text-xs mb-1">Active Goals</div>
              <div className="flex flex-wrap gap-1">
                {preferences.fitness_goals?.slice(0, 2).map((goal) => (
                  <Badge key={goal} variant="secondary" className="bg-blue-600 text-white text-xs px-2 py-0.5">
                    {goal.split('_')[0]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Active Sports */}
            <div>
              <div className="text-white/70 text-xs mb-1">Preferred Sports</div>
              <div className="flex flex-wrap gap-1">
                {preferences.preferred_sport_types?.map((sport) => (
                  <Badge key={sport} variant="outline" className="border-white/40 text-white text-xs px-2 py-0.5">
                    {sport === 'HIIT' ? 'HIIT' : sport.split('_')[0]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 