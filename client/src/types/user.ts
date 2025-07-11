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

export enum SportType {
  CARDIO = "CARDIO",
  STRENGTH = "STRENGTH",
  HIIT = "HIIT",
  YOGA = "YOGA",
  PILATES = "PILATES",
  CROSSFIT = "CROSSFIT",
  SWIMMING = "SWIMMING",
  RUNNING = "RUNNING",
  CYCLING = "CYCLING",
  WEIGHTLIFTING = "WEIGHTLIFTING"
}

export enum EquipmentItem {
  NONE = "NONE",
  DUMBBELLS = "DUMBBELLS",
  BARBELL = "BARBELL",
  KETTLEBELL = "KETTLEBELL",
  RESISTANCE_BANDS = "RESISTANCE_BANDS",
  PULL_UP_BAR = "PULL_UP_BAR",
  YOGA_MAT = "YOGA_MAT",
  TREADMILL = "TREADMILL",
  STATIONARY_BIKE = "STATIONARY_BIKE",
  ROWING_MACHINE = "ROWING_MACHINE",
  FULL_GYM = "FULL_GYM"
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