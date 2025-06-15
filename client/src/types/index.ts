// Enum types based on class diagram
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
  OTHER = 'OTHER'
}

export enum ExperienceLevel {
  TRUE_BEGINNER = 'TRUE_BEGINNER',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  REHAB_POSTPARTUM = 'REHAB_POSTPARTUM'
}

export enum FitnessGoal {
  WEIGHT_LOSS = 'WEIGHT_LOSS',
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  STRENGTH_GAIN = 'STRENGTH_GAIN',
  IMPROVE_ENDURANCE = 'IMPROVE_ENDURANCE',
  IMPROVE_FLEXIBILITY_MOBILITY = 'IMPROVE_FLEXIBILITY_MOBILITY',
  GENERAL_HEALTH_FITNESS = 'GENERAL_HEALTH_FITNESS',
  ATHLETIC_PERFORMANCE = 'ATHLETIC_PERFORMANCE',
  STRESS_REDUCTION_WELLBEING = 'STRESS_REDUCTION_WELLBEING'
}

export enum SportType {
  STRENGTH = 'STRENGTH',
  HIIT = 'HIIT',
  YOGA_MOBILITY = 'YOGA_MOBILITY',
  RUNNING_INTERVALS = 'RUNNING_INTERVALS'
}

export enum EquipmentItem {
  NO_EQUIPMENT = 'NO_EQUIPMENT',
  DUMBBELLS_PAIR_LIGHT = 'DUMBBELLS_PAIR_LIGHT',
  DUMBBELLS_PAIR_MEDIUM = 'DUMBBELLS_PAIR_MEDIUM',
  DUMBBELLS_PAIR_HEAVY = 'DUMBBELLS_PAIR_HEAVY',
  ADJUSTABLE_DUMBBELLS = 'ADJUSTABLE_DUMBBELLS',
  KETTLEBELL = 'KETTLEBELL',
  BARBELL_WITH_PLATES = 'BARBELL_WITH_PLATES',
  RESISTANCE_BANDS_LIGHT = 'RESISTANCE_BANDS_LIGHT',
  RESISTANCE_BANDS_MEDIUM = 'RESISTANCE_BANDS_MEDIUM',
  RESISTANCE_BANDS_HEAVY = 'RESISTANCE_BANDS_HEAVY',
  PULL_UP_BAR = 'PULL_UP_BAR',
  YOGA_MAT = 'YOGA_MAT',
  FOAM_ROLLER = 'FOAM_ROLLER',
  JUMP_ROPE = 'JUMP_ROPE',
  BENCH_FLAT = 'BENCH_FLAT',
  BENCH_ADJUSTABLE = 'BENCH_ADJUSTABLE',
  SQUAT_RACK = 'SQUAT_RACK',
  TREADMILL = 'TREADMILL',
  STATIONARY_BIKE = 'STATIONARY_BIKE',
  ELLIPTICAL = 'ELLIPTICAL',
  ROWING_MACHINE = 'ROWING_MACHINE',
  CABLE_MACHINE_FULL = 'CABLE_MACHINE_FULL',
  LEG_PRESS_MACHINE = 'LEG_PRESS_MACHINE',
  MEDICINE_BALL = 'MEDICINE_BALL',
  STABILITY_BALL = 'STABILITY_BALL'
}

export enum IntensityPreference {
  LOW_MODERATE = 'LOW_MODERATE',
  MODERATE_HIGH = 'MODERATE_HIGH',
  PUSH_TO_LIMIT = 'PUSH_TO_LIMIT'
}

// Core entity types
export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  date_of_birth: Date
  height_cm: number
  weight_kg: number
  gender: Gender
  created_at: Date
  updated_at: Date
}

export interface UserPreferences {
  user_id: string
  experience_level: ExperienceLevel
  fitness_goals: FitnessGoal[]
  preferred_sport_types: SportType[]
  available_equipment: EquipmentItem[]
  workout_duration_range: string // e.g., "30-45 minutes"
  intensity_preference: IntensityPreference
  health_notes: string
  disliked_exercises: string[]
}

export interface DailyWorkout {
  id: string
  user_id: string
  day_date: Date
  focus_sport_type_for_the_day: string
  completion_status: string
  rpe_overall_feedback?: number
  cadence_metrics?: string
  completion_notes?: string
}

export interface ScheduledExercise {
  id: string
  daily_workout_id: string
  sequence_order: number
  exercise_name: string
  description: string
  applicable_sport_types: SportType[]
  muscle_groups_primary: string[]
  muscle_groups_secondary: string[]
  equipment_needed: EquipmentItem[]
  difficulty: string
  prescribed_sets_reps_duration: string
  voice_script_cue_text: string
  video_url?: string
  rpe_feedback?: number
  completion_status: string
}

// UI-specific types
export interface ChatMessage {
  id: string
  content: string
  timestamp: Date
  isUser: boolean
}

export interface WorkoutSchedule {
  [date: string]: DailyWorkout
} 