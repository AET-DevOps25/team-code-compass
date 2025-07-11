import { useState, useCallback, useEffect } from 'react';
import { workoutService } from '../services/workoutService';
import { useAuth } from './useAuth';
import {
  DailyWorkoutResponse,
  WorkoutGenerationOptions,
  WorkoutDateRange,
  SportType,
  CompletionStatus
} from '../types/workout';
import { ApiResponse } from '../types/user';

interface UseWorkoutState {
  // Current workout data
  currentWorkout: DailyWorkoutResponse | null;
  workoutHistory: DailyWorkoutResponse[];
  
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  isFetching: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  generateWorkout: (options: WorkoutGenerationOptions) => Promise<DailyWorkoutResponse | null>;
  getTodaysWorkout: () => Promise<DailyWorkoutResponse | null>;
  getWorkoutByDate: (date: string) => Promise<DailyWorkoutResponse | null>;
  getWorkoutHistory: (dateRange?: WorkoutDateRange) => Promise<DailyWorkoutResponse[]>;
  refreshCurrentWorkout: () => Promise<void>;
  clearError: () => void;
  
  // Convenience methods
  generateQuickWorkout: (sportType: SportType, duration?: number) => Promise<DailyWorkoutResponse | null>;
  hasWorkoutForToday: boolean;
}

export function useWorkout(): UseWorkoutState {
  const { user } = useAuth();
  const [currentWorkout, setCurrentWorkout] = useState<DailyWorkoutResponse | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<DailyWorkoutResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiResponse = useCallback(<T,>(response: ApiResponse<T>): T | null => {
    if (response.error) {
      setError(response.error.error);
      return null;
    }
    clearError();
    return response.data || null;
  }, [clearError]);

  const generateWorkout = useCallback(async (options: WorkoutGenerationOptions): Promise<DailyWorkoutResponse | null> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await workoutService.generateWorkoutPlan(options);
      const workout = handleApiResponse(response);
      
      if (workout) {
        setCurrentWorkout(workout);
        // If generating for today, update current workout
        const today = new Date().toISOString().split('T')[0];
        if (!options.date || options.date === today) {
          setCurrentWorkout(workout);
        }
      }
      
      return workout;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate workout';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [handleApiResponse]);

  const getTodaysWorkout = useCallback(async (): Promise<DailyWorkoutResponse | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsFetching(true);
    setError(null);
    
    try {
      const response = await workoutService.getTodaysWorkout(user.id);
      const workout = handleApiResponse(response);
      
      if (workout) {
        setCurrentWorkout(workout);
      }
      
      return workout;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s workout';
      setError(errorMessage);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [handleApiResponse, user?.id]);

  const getWorkoutByDate = useCallback(async (date: string): Promise<DailyWorkoutResponse | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsFetching(true);
    setError(null);
    
    try {
      const response = await workoutService.getMyWorkoutByDate(date, user.id);
      const workout = handleApiResponse(response);
      
      // If fetching today's workout, update current workout
      const today = new Date().toISOString().split('T')[0];
      if (date === today && workout) {
        setCurrentWorkout(workout);
      }
      
      return workout;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workout';
      setError(errorMessage);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [handleApiResponse, user?.id]);

  const getWorkoutHistory = useCallback(async (dateRange?: WorkoutDateRange): Promise<DailyWorkoutResponse[]> => {
    if (!user?.id) {
      setError('User not authenticated');
      return [];
    }

    setIsFetching(true);
    setError(null);
    
    try {
      let response: ApiResponse<DailyWorkoutResponse[]>;
      
      if (dateRange) {
        response = await workoutService.getMyWorkoutsByDateRange(dateRange, user.id);
      } else {
        // Default to this month's workouts
        response = await workoutService.getThisMonthsWorkouts(user.id);
      }
      
      const workouts = handleApiResponse(response) || [];
      setWorkoutHistory(workouts);
      
      return workouts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workout history';
      setError(errorMessage);
      return [];
    } finally {
      setIsFetching(false);
    }
  }, [handleApiResponse, user?.id]);

  const refreshCurrentWorkout = useCallback(async (): Promise<void> => {
    await getTodaysWorkout();
  }, [getTodaysWorkout]);

  const generateQuickWorkout = useCallback(async (sportType: SportType, duration: number = 30): Promise<DailyWorkoutResponse | null> => {
    return generateWorkout({
      sportType,
      targetDurationMinutes: duration
    });
  }, [generateWorkout]);

  // Auto-fetch today's workout on mount
  useEffect(() => {
    getTodaysWorkout();
  }, [getTodaysWorkout]);

  // Calculate if there's a workout for today
  const hasWorkoutForToday = currentWorkout !== null;

  return {
    // State
    currentWorkout,
    workoutHistory,
    isLoading: isLoading || isGenerating || isFetching,
    isGenerating,
    isFetching,
    error,
    
    // Actions
    generateWorkout,
    getTodaysWorkout,
    getWorkoutByDate,
    getWorkoutHistory,
    refreshCurrentWorkout,
    clearError,
    
    // Convenience
    generateQuickWorkout,
    hasWorkoutForToday,
  };
}

// Additional hooks for specific use cases
export function useWorkoutGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWorkout = useCallback(async (options: WorkoutGenerationOptions): Promise<DailyWorkoutResponse | null> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await workoutService.generateWorkoutPlan(options);
      
      if (response.error) {
        setError(response.error.error);
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate workout';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateWorkout,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
}

export function useWorkoutHistory() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<DailyWorkoutResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async (dateRange?: WorkoutDateRange) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let response: ApiResponse<DailyWorkoutResponse[]>;
      
      if (dateRange) {
        response = await workoutService.getMyWorkoutsByDateRange(dateRange, user.id);
      } else {
        response = await workoutService.getThisMonthsWorkouts(user.id);
      }
      
      if (response.error) {
        setError(response.error.error);
        return;
      }
      
      setWorkouts(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workout history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    workouts,
    isLoading,
    error,
    fetchWorkouts,
    clearError: () => setError(null)
  };
} 