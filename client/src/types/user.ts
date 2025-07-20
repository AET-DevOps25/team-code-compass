// Enums matching the backend
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export enum ExperienceLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT"
}

export enum FitnessGoal {
  WEIGHT_LOSS = "WEIGHT_LOSS",
  MUSCLE_GAIN = "MUSCLE_GAIN",
  ENDURANCE = "ENDURANCE",
  STRENGTH = "STRENGTH",
  FLEXIBILITY = "FLEXIBILITY",
  GENERAL_FITNESS = "GENERAL_FITNESS"
}

// Updated to match backend exactly
export enum SportType {
  STRENGTH = "STRENGTH",
  HIIT = "HIIT",
  YOGA_MOBILITY = "YOGA_MOBILITY",
  RUNNING_INTERVALS = "RUNNING_INTERVALS"
}

// Updated to match backend exactly  
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

export enum IntensityPreference {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  EXTREME = "EXTREME"
}

// Request/Response DTOs
export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string; // ISO date string
  gender: Gender;
  heightCm?: number;
  weightKg?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserPreferencesResponse {
  experienceLevel?: ExperienceLevel;
  fitnessGoals?: FitnessGoal[];
  preferredSportTypes?: SportType[];
  availableEquipment?: EquipmentItem[];
  workoutDurationRange?: string;
  intensityPreference?: IntensityPreference;
  healthNotes?: string;
  dislikedExercises?: string[];
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  dateOfBirth: string; // ISO date string
  heightCm?: number;
  weightKg?: number;
  gender: Gender;
  preferences?: UserPreferencesResponse;
  createdAt: string; // ISO date string
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
  message: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  dateOfBirth?: string; // ISO date string
  heightCm?: number;
  weightKg?: number;
  gender?: Gender;
}

// Additional types for API responses
export interface ApiError {
  error: string;
  details?: Record<string, string>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
} 