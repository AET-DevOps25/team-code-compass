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
}

// Create a singleton instance
export const workoutService = new WorkoutService(); 