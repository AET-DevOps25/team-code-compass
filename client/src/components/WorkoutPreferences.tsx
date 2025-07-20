import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Dumbbell, 
  Clock, 
  TrendingUp, 
  Settings, 
  CheckCircle,
  User,
  Activity,
  Flame
} from 'lucide-react';

// Import types from user types (now matches backend)
import { 
  ExperienceLevel, 
  FitnessGoal, 
  IntensityPreference, 
  SportType,
  EquipmentItem
} from '../types/user';

// Import workout-specific types
import { CompletionStatus } from '../types/workout';

interface WorkoutPreferencesForm {
  // User Profile Preferences
  experienceLevel: ExperienceLevel;
  fitnessGoals: FitnessGoal[];
  intensityPreference: IntensityPreference;
  
  // Workout-Specific Preferences
  preferredSportTypes: SportType[];
  availableEquipment: EquipmentItem[];
  workoutDurationRange: string;
  workoutsPerWeek: number;
  preferredTimeOfDay: string;
  
  // Health & Restrictions
  healthNotes: string;
  dislikedExercises: string[];
  
  // Quick Settings
  quickWorkoutDuration: number;
  defaultSportType: SportType;
}

interface WorkoutPreferencesProps {
  initialPreferences?: Partial<WorkoutPreferencesForm>;
  onSave: (preferences: WorkoutPreferencesForm) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Helper functions to convert enum values to display names
const getDisplayName = (value: string): string => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getSportTypeIcon = (sportType: SportType) => {
  switch (sportType) {
    case SportType.STRENGTH:
      return <Dumbbell className="h-4 w-4" />;
    case SportType.HIIT:
      return <Flame className="h-4 w-4" />;
    case SportType.YOGA_MOBILITY:
      return <Activity className="h-4 w-4" />;
    case SportType.RUNNING_INTERVALS:
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
};

const getEquipmentIcon = (equipment: EquipmentItem) => {
  switch (equipment) {
    case EquipmentItem.NO_EQUIPMENT:
      return <User className="h-4 w-4" />;
    case EquipmentItem.DUMBBELLS_PAIR_LIGHT:
    case EquipmentItem.DUMBBELLS_PAIR_MEDIUM:
    case EquipmentItem.DUMBBELLS_PAIR_HEAVY:
    case EquipmentItem.ADJUSTABLE_DUMBBELLS:
      return <Dumbbell className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

export function WorkoutPreferences({ 
  initialPreferences = {}, 
  onSave, 
  onCancel, 
  isLoading = false 
}: WorkoutPreferencesProps) {
  const [preferences, setPreferences] = useState<WorkoutPreferencesForm>({
    experienceLevel: ExperienceLevel.BEGINNER,
    fitnessGoals: [FitnessGoal.GENERAL_FITNESS],
    intensityPreference: IntensityPreference.MODERATE,
    preferredSportTypes: [SportType.STRENGTH],
    availableEquipment: [EquipmentItem.NO_EQUIPMENT],
    workoutDurationRange: '30-45 minutes',
    workoutsPerWeek: 3,
    preferredTimeOfDay: 'EVENING',
    healthNotes: '',
    dislikedExercises: [],
    quickWorkoutDuration: 30,
    defaultSportType: SportType.STRENGTH,
    ...initialPreferences
  });

  const [dislikedExerciseInput, setDislikedExerciseInput] = useState('');

  const handleSelectChange = (field: keyof WorkoutPreferencesForm, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field: keyof WorkoutPreferencesForm, value: any) => {
    setPreferences(prev => {
      const currentArray = prev[field] as any[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleAddDislikedExercise = () => {
    if (dislikedExerciseInput.trim()) {
      setPreferences(prev => ({
        ...prev,
        dislikedExercises: [...prev.dislikedExercises, dislikedExerciseInput.trim()]
      }));
      setDislikedExerciseInput('');
    }
  };

  const handleRemoveDislikedExercise = (exercise: string) => {
    setPreferences(prev => ({
      ...prev,
      dislikedExercises: prev.dislikedExercises.filter(e => e !== exercise)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(preferences);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile & Experience</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select 
                value={preferences.experienceLevel} 
                onValueChange={(value: ExperienceLevel) => handleSelectChange('experienceLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExperienceLevel).map(level => (
                    <SelectItem key={level} value={level}>
                      {getDisplayName(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="intensityPreference">Preferred Intensity</Label>
              <Select 
                value={preferences.intensityPreference} 
                onValueChange={(value: IntensityPreference) => handleSelectChange('intensityPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IntensityPreference).map(intensity => (
                    <SelectItem key={intensity} value={intensity}>
                      {getDisplayName(intensity)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Fitness Goals</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {Object.values(FitnessGoal).map(goal => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`goal-${goal}`}
                    checked={preferences.fitnessGoals.includes(goal)}
                    onCheckedChange={() => handleArrayToggle('fitnessGoals', goal)}
                  />
                  <Label htmlFor={`goal-${goal}`} className="text-sm">
                    {getDisplayName(goal)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Workout Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Sport Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {Object.values(SportType).map(sport => (
                <div key={sport} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`sport-${sport}`}
                    checked={preferences.preferredSportTypes.includes(sport)}
                    onCheckedChange={() => handleArrayToggle('preferredSportTypes', sport)}
                  />
                  <Label htmlFor={`sport-${sport}`} className="text-sm flex items-center space-x-1">
                    {getSportTypeIcon(sport)}
                    <span>{getDisplayName(sport)}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workoutDurationRange">Workout Duration Range</Label>
              <Select 
                value={preferences.workoutDurationRange} 
                onValueChange={(value: string) => handleSelectChange('workoutDurationRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-30 minutes">15-30 minutes</SelectItem>
                  <SelectItem value="30-45 minutes">30-45 minutes</SelectItem>
                  <SelectItem value="45-60 minutes">45-60 minutes</SelectItem>
                  <SelectItem value="60-90 minutes">60-90 minutes</SelectItem>
                  <SelectItem value="90+ minutes">90+ minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="workoutsPerWeek">Workouts Per Week</Label>
              <Input
                type="number"
                id="workoutsPerWeek"
                min="1"
                max="7"
                value={preferences.workoutsPerWeek}
                onChange={(e) => handleSelectChange('workoutsPerWeek', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preferredTimeOfDay">Preferred Time of Day</Label>
            <Select 
              value={preferences.preferredTimeOfDay} 
              onValueChange={(value: string) => handleSelectChange('preferredTimeOfDay', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MORNING">Morning (6-10 AM)</SelectItem>
                <SelectItem value="AFTERNOON">Afternoon (12-4 PM)</SelectItem>
                <SelectItem value="EVENING">Evening (6-9 PM)</SelectItem>
                <SelectItem value="FLEXIBLE">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Available Equipment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(EquipmentItem).map(equipment => (
              <div key={equipment} className="flex items-center space-x-2">
                <Checkbox 
                  id={`equipment-${equipment}`}
                  checked={preferences.availableEquipment.includes(equipment)}
                  onCheckedChange={() => handleArrayToggle('availableEquipment', equipment)}
                />
                <Label htmlFor={`equipment-${equipment}`} className="text-sm flex items-center space-x-1">
                  {getEquipmentIcon(equipment)}
                  <span>{getDisplayName(equipment)}</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health & Restrictions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Health & Restrictions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="healthNotes">Health Notes & Restrictions</Label>
            <Textarea
              id="healthNotes"
              placeholder="e.g., Lower back issues, knee problems, etc."
              value={preferences.healthNotes}
              onChange={(e) => handleSelectChange('healthNotes', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Disliked Exercises</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                placeholder="Add exercise to avoid"
                value={dislikedExerciseInput}
                onChange={(e) => setDislikedExerciseInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDislikedExercise())}
              />
              <Button type="button" onClick={handleAddDislikedExercise} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {preferences.dislikedExercises.map(exercise => (
                <Badge key={exercise} variant="secondary" className="cursor-pointer hover:bg-red-100">
                  {exercise}
                  <button 
                    type="button"
                    onClick={() => handleRemoveDislikedExercise(exercise)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Quick Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quickWorkoutDuration">Default Quick Workout Duration (minutes)</Label>
              <Input
                type="number"
                id="quickWorkoutDuration"
                min="15"
                max="120"
                step="15"
                value={preferences.quickWorkoutDuration}
                onChange={(e) => handleSelectChange('quickWorkoutDuration', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="defaultSportType">Default Sport Type</Label>
              <Select 
                value={preferences.defaultSportType} 
                onValueChange={(value: SportType) => handleSelectChange('defaultSportType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default sport" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SportType).map(sport => (
                    <SelectItem key={sport} value={sport}>
                      <div className="flex items-center space-x-2">
                        {getSportTypeIcon(sport)}
                        <span>{getDisplayName(sport)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default WorkoutPreferences; 