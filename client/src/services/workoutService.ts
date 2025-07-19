import { apiClient } from './apiClient';
import { ApiResponse } from '../types/user';
import {
  WorkoutPlanGenerationRequest,
  DailyWorkoutResponse,
  WorkoutGenerationOptions,
  WorkoutDateRange,
  WorkoutHealthResponse,
  WorkoutInfoResponse,
  SportType
} from '../types/workout';

// Add weekly generation options
export interface WeeklyWorkoutGenerationOptions {
  sportType: SportType;
  targetDurationMinutes: number;
  startDate?: string; // ISO date string for week start, defaults to next Monday
  customPrompt?: string; // Optional custom prompt for LLM
}

export class WorkoutService {
  private readonly baseEndpoint = '/workout-plan-service/api/v1/plans';

  /**
   * Generate a new workout plan for a user
   */
  async generateWorkoutPlan(options: WorkoutGenerationOptions, userId?: string): Promise<ApiResponse<DailyWorkoutResponse>> {
    // Use current user if no userId provided (will be handled by backend auth)
    const request: WorkoutPlanGenerationRequest = {
      userId: userId || '', // Backend will extract from token if empty
      dayDate: options.date || new Date().toISOString().split('T')[0], // Default to today
      focusSportType: options.sportType,
      targetDurationMinutes: options.targetDurationMinutes
    };

    return apiClient.post<DailyWorkoutResponse, WorkoutPlanGenerationRequest>(
      `${this.baseEndpoint}/generate`,
      request
    );
  }

  /**
   * Generate a weekly workout plan for a user
   */
  async generateWeeklyWorkoutPlan(options: WeeklyWorkoutGenerationOptions, userId?: string): Promise<ApiResponse<DailyWorkoutResponse[]>> {
    // Calculate start date (next Monday if not provided)
    const startDate = options.startDate || this.getNextMonday();
    
    const request: WorkoutPlanGenerationRequest = {
      userId: userId || '', // Backend will extract from token if empty
      dayDate: startDate,
      focusSportType: options.sportType,
      targetDurationMinutes: options.targetDurationMinutes
    };

    return apiClient.post<DailyWorkoutResponse[], WorkoutPlanGenerationRequest>(
      `${this.baseEndpoint}/generate-weekly-plan`,
      request
    );
  }

  /**
   * Get a specific workout by user ID and date
   */
  async getWorkoutByDate(userId: string, date: string): Promise<ApiResponse<DailyWorkoutResponse>> {
    return apiClient.get<DailyWorkoutResponse>(
      `${this.baseEndpoint}/user/${userId}/date/${date}`
    );
  }

  /**
   * Get current user's workout for a specific date
   * Note: This requires the user ID to be passed. In a real implementation,
   * you'd get this from the auth context or user profile
   */
  async getMyWorkoutByDate(date: string, userId: string): Promise<ApiResponse<DailyWorkoutResponse>> {
    return apiClient.get<DailyWorkoutResponse>(
      `${this.baseEndpoint}/user/${userId}/date/${date}`
    );
  }

  /**
   * Get workouts for a user within a date range
   */
  async getWorkoutsByDateRange(userId: string, dateRange: WorkoutDateRange): Promise<ApiResponse<DailyWorkoutResponse[]>> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    return apiClient.get<DailyWorkoutResponse[]>(
      `${this.baseEndpoint}/user/${userId}/range?${params.toString()}`
    );
  }

  /**
   * Get current user's workouts within a date range
   * Note: This requires the user ID to be passed. In a real implementation,
   * you'd get this from the auth context or user profile
   */
  async getMyWorkoutsByDateRange(dateRange: WorkoutDateRange, userId: string): Promise<ApiResponse<DailyWorkoutResponse[]>> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    return apiClient.get<DailyWorkoutResponse[]>(
      `${this.baseEndpoint}/user/${userId}/range?${params.toString()}`
    );
  }

  /**
   * Get workout for today (convenience method)
   * Note: This requires the user ID to be passed. In a real implementation,
   * you'd get this from the auth context or user profile
   */
  async getTodaysWorkout(userId: string): Promise<ApiResponse<DailyWorkoutResponse>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMyWorkoutByDate(today, userId);
  }

  /**
   * Get workouts for the current week (convenience method)
   * Note: This requires the user ID to be passed. In a real implementation,
   * you'd get this from the auth context or user profile
   */
  async getThisWeeksWorkouts(userId: string): Promise<ApiResponse<DailyWorkoutResponse[]>> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of current week (Saturday)

    const dateRange: WorkoutDateRange = {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    };

    return this.getMyWorkoutsByDateRange(dateRange, userId);
  }

  /**
   * Get workouts for the last 7 days (for workout history context)
   * Note: This requires the user ID to be passed. In a real implementation,
   * you'd get this from the auth context or user profile
   */
  async getLastWeeksWorkouts(userId: string): Promise<ApiResponse<DailyWorkoutResponse[]>> {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateRange: WorkoutDateRange = {
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      endDate: yesterday.toISOString().split('T')[0]
    };

    return this.getMyWorkoutsByDateRange(dateRange, userId);
  }

  /**
   * Get workouts for the current month (convenience method)
   * Note: This requires the user ID to be passed. In a real implementation,
   * you'd get this from the auth context or user profile
   */
  async getThisMonthsWorkouts(userId: string): Promise<ApiResponse<DailyWorkoutResponse[]>> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dateRange: WorkoutDateRange = {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    };

    return this.getMyWorkoutsByDateRange(dateRange, userId);
  }

  /**
   * Generate a quick workout with common defaults
   */
  async generateQuickWorkout(sportType: SportType, duration: number = 30): Promise<ApiResponse<DailyWorkoutResponse>> {
    return this.generateWorkoutPlan({
      sportType,
      targetDurationMinutes: duration
    });
  }

  /**
   * Check workout service health
   */
  async checkHealthStatus(): Promise<ApiResponse<WorkoutHealthResponse>> {
    return apiClient.get<WorkoutHealthResponse>(`${this.baseEndpoint}/health`);
  }

  /**
   * Get workout service info
   */
  async getServiceInfo(): Promise<ApiResponse<WorkoutInfoResponse>> {
    return apiClient.get<WorkoutInfoResponse>(`${this.baseEndpoint}/info`);
  }

  /**
   * Get next Monday's date for weekly workout generation
   */
  private getNextMonday(): string {
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (7 - today.getDay() + 1) % 7 || 7; // Get days until next Monday
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }

  /**
   * Utility methods for date handling
   */
  static formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static parseAPIDate(dateString: string): Date {
    return new Date(dateString);
  }

  static getDateRange(startDate: Date, endDate: Date): WorkoutDateRange {
    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate)
    };
  }

  /**
   * Mark a workout as completed
   */
  async completeWorkout(workoutId: string): Promise<ApiResponse<DailyWorkoutResponse>> {
    return apiClient.put<DailyWorkoutResponse>(
      `${this.baseEndpoint}/workout/${workoutId}/complete`
    );
  }

  /**
   * Mark an exercise as completed
   */
  async completeExercise(exerciseId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return apiClient.put<{ status: string; message: string }>(
      `${this.baseEndpoint}/exercise/${exerciseId}/complete`
    );
  }
}

// Create a singleton instance
export const workoutService = new WorkoutService(); 