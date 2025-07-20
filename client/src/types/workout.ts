// Enums matching the workout-plan-service backend
export enum SportType {
  STRENGTH = "STRENGTH",
  HIIT = "HIIT",
  YOGA_MOBILITY = "YOGA_MOBILITY",
  RUNNING_INTERVALS = "RUNNING_INTERVALS"
}

export enum CompletionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
  IN_PROGRESS = "IN_PROGRESS"
}

export enum EquipmentItem {
  NO_EQUIPMENT = "NO_EQUIPMENT",
  DUMBBELLS_PAIR_LIGHT = "DUMBBELLS_PAIR_LIGHT",
  DUMBBELLS_PAIR_MEDIUM = "DUMBBELLS_PAIR_MEDIUM",
  DUMBBELLS_PAIR_HEAVY = "DUMBBELLS_PAIR_HEAVY",
  ADJUSTABLE_DUMBBELLS = "ADJUSTABLE_DUMBBELLS",
  KETTLEBELL = "KETTLEBELL",
  BARBELL_WITH_PLATES = "BARBELL_WITH_PLATES",
  RESISTANCE_BANDS_LIGHT = "RESISTANCE_BANDS_LIGHT",
  RESISTANCE_BANDS_MEDIUM = "RESISTANCE_BANDS_MEDIUM",
  RESISTANCE_BANDS_HEAVY = "RESISTANCE_BANDS_HEAVY",
  PULL_UP_BAR = "PULL_UP_BAR",
  YOGA_MAT = "YOGA_MAT",
  FOAM_ROLLER = "FOAM_ROLLER",
  JUMP_ROPE = "JUMP_ROPE",
  BENCH_FLAT = "BENCH_FLAT",
  BENCH_ADJUSTABLE = "BENCH_ADJUSTABLE",
  SQUAT_RACK = "SQUAT_RACK",
  TREADMILL = "TREADMILL",
  STATIONARY_BIKE = "STATIONARY_BIKE",
  ELLIPTICAL = "ELLIPTICAL",
  ROWING_MACHINE = "ROWING_MACHINE",
  CABLE_MACHINE_FULL = "CABLE_MACHINE_FULL",
  LEG_PRESS_MACHINE = "LEG_PRESS_MACHINE",
  MEDICINE_BALL = "MEDICINE_BALL",
  STABILITY_BALL = "STABILITY_BALL"
}

// Request DTOs
export interface WorkoutPlanGenerationRequest {
  userId: string;
  dayDate: string; // ISO date string (YYYY-MM-DD)
  focusSportType: SportType;
  targetDurationMinutes: number;
  textPrompt?: string; // Optional custom prompt for workout generation
  aiPreference?: string; // Optional AI preference: "cloud" or "local"
}

// Response DTOs
export interface ScheduledExerciseResponse {
  id: string;
  sequenceOrder: number;
  exerciseName: string;
  description: string;
  applicableSportTypes: SportType[];
  muscleGroupsPrimary: string[];
  muscleGroupsSecondary: string[];
  equipmentNeeded: EquipmentItem[];
  difficulty: string;
  prescribedSetsRepsDuration: string;
  voiceScriptCueText: string;
  videoUrl: string;
  rpeFeedback?: number;
  completionStatus: CompletionStatus;
}

export interface DailyWorkoutResponse {
  id: string;
  userId: string;
  dayDate: string; // ISO date string (YYYY-MM-DD)
  focusSportTypeForTheDay: SportType;
  completionStatus: CompletionStatus;
  rpeOverallFeedback?: number;
  completionNotes?: string;
  markdownContent: string;
  scheduledExercises: ScheduledExerciseResponse[];
}

// Additional types for better UX
export interface WorkoutGenerationOptions {
  sportType: SportType;
  targetDurationMinutes: number;
  date?: string; // Optional, defaults to today
  aiPreference?: string; // Optional, "cloud" or "local", defaults to "cloud"
}

export interface WorkoutDateRange {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
}

export interface WorkoutHealthResponse {
  service: string;
  status: string;
  message: string;
}

export interface WorkoutInfoResponse {
  service: string;
  version: string;
  description: string;
} 