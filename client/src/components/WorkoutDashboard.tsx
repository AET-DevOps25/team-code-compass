import React, { useState } from 'react';
import { useWorkout, useWorkoutGeneration } from '../hooks/useWorkout';
import { SportType, CompletionStatus } from '../types/workout';
import { workoutService, WeeklyWorkoutGenerationOptions } from '../services/workoutService';

export function WorkoutDashboard() {
  const {
    currentWorkout,
    isLoading,
    error,
    getTodaysWorkout,
    getWorkoutHistory,
    clearError,
    hasWorkoutForToday
  } = useWorkout();

  const {
    generateWorkout,
    isGenerating,
    error: generationError,
    clearError: clearGenerationError
  } = useWorkoutGeneration();

  const [selectedSport, setSelectedSport] = useState<SportType>(SportType.STRENGTH);
  const [duration, setDuration] = useState(30);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<any[]>([]);

  const handleGenerateWorkout = async () => {
    clearGenerationError();
    const workout = await generateWorkout({
      sportType: selectedSport,
      targetDurationMinutes: duration
    });
    
    if (workout) {
      // Refresh today's workout to show the newly generated one
      await getTodaysWorkout();
    }
  };

  const handleGenerateWeeklyWorkout = async () => {
    clearGenerationError();
    setIsGeneratingWeekly(true);
    
    try {
      const weeklyOptions: WeeklyWorkoutGenerationOptions = {
        sportType: selectedSport,
        targetDurationMinutes: duration,
        customPrompt: customPrompt.trim() || undefined
      };
      
      const response = await workoutService.generateWeeklyWorkoutPlan(weeklyOptions);
      
      if (response.data) {
        setWeeklyWorkouts(response.data);
        console.log('Weekly workouts generated:', response.data);
      } else if (response.error) {
        console.error('Weekly generation error:', response.error);
      }
    } catch (error) {
      console.error('Failed to generate weekly workout:', error);
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  const handleRefreshWorkout = async () => {
    clearError();
    await getTodaysWorkout();
  };

  const handleViewHistory = async () => {
    clearError();
    await getWorkoutHistory();
  };

  const handleCompleteExercise = async (exerciseId: string) => {
    try {
      console.log('Completing exercise:', exerciseId);
      
      const response = await workoutService.completeExercise(exerciseId);
      
      if (response.data) {
        console.log('Exercise completed successfully:', response.data.message);
        // Refresh the workout to update the UI with new completion status
        await getTodaysWorkout();
      } else if (response.error) {
        console.error('Failed to complete exercise:', response.error);
      }
    } catch (error) {
      console.error('Failed to complete exercise:', error);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;
    
    try {
      console.log('Completing workout:', currentWorkout.id);
      
      const response = await workoutService.completeWorkout(currentWorkout.id);
      
      if (response.data) {
        console.log('Workout completed successfully:', response.data);
        // Refresh the workout to update the UI with new completion status
        await getTodaysWorkout();
      } else if (response.error) {
        console.error('Failed to complete workout:', response.error);
      }
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Workout Dashboard</h1>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {generationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{generationError}</span>
            <button 
              onClick={clearGenerationError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Workout Generation Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Workouts</h2>
        
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport Type
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value as SportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(SportType).map((sport) => (
                <option key={sport} value={sport}>
                  {sport.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="120"
              step="15"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Custom Prompt for LLM */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter any specific requirements or preferences for your workout..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Generation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleGenerateWorkout}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Daily Workout'}
          </button>
          
          <button
            onClick={handleGenerateWeeklyWorkout}
            disabled={isGeneratingWeekly}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {isGeneratingWeekly ? 'Generating Weekly...' : 'Generate Weekly Plan'}
          </button>
        </div>
      </div>

      {/* Weekly Workouts Display */}
      {weeklyWorkouts.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Weekly Workout Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyWorkouts.map((workout, index) => (
              <div key={workout.id || index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">
                  Day {index + 1}: {workout.focusSportTypeForTheDay?.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Date: {new Date(workout.dayDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  {workout.scheduledExercises?.length || 0} exercises
                </p>
                <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                  {workout.markdownContent && (
                    <div dangerouslySetInnerHTML={{ 
                      __html: workout.markdownContent.substring(0, 200) + '...' 
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Workout Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Today's Workout</h2>
          <button
            onClick={handleRefreshWorkout}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading workout...</p>
          </div>
        ) : hasWorkoutForToday && currentWorkout ? (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  {currentWorkout.focusSportTypeForTheDay.replace('_', ' ')}
                </span>
                <span className={`inline-block text-sm font-medium px-2.5 py-0.5 rounded ml-2 ${
                  currentWorkout.completionStatus === 'COMPLETED' 
                    ? 'bg-green-100 text-green-800' 
                    : currentWorkout.completionStatus === 'IN_PROGRESS'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentWorkout.completionStatus?.replace('_', ' ') || 'PENDING'}
                </span>
              </div>
              
              {currentWorkout.completionStatus !== 'COMPLETED' && (
                <button
                  onClick={handleCompleteWorkout}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                >
                  ✓ Complete Workout
                </button>
              )}
            </div>

            {currentWorkout.markdownContent && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="font-medium mb-2">Workout Plan:</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {currentWorkout.markdownContent}
                </pre>
              </div>
            )}

            {currentWorkout.scheduledExercises && currentWorkout.scheduledExercises.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Exercises ({currentWorkout.scheduledExercises.length}):</h3>
                <div className="space-y-3">
                  {currentWorkout.scheduledExercises.map((exercise, index) => (
                    <div key={exercise.id || index} className={`border-l-4 pl-4 p-3 rounded-r-md ${
                      exercise.completionStatus === 'COMPLETED' 
                        ? 'border-green-500 bg-green-50' 
                        : exercise.completionStatus === 'IN_PROGRESS'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-white'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{exercise.sequenceOrder}. {exercise.exerciseName}</h4>
                          <p className="text-sm text-gray-600 mb-1">{exercise.description}</p>
                          <p className="text-sm text-blue-600">{exercise.prescribedSetsRepsDuration}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {exercise.difficulty && (
                              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                {exercise.difficulty}
                              </span>
                            )}
                            <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                              exercise.completionStatus === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : exercise.completionStatus === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {exercise.completionStatus?.replace('_', ' ') || 'PENDING'}
                            </span>
                          </div>
                        </div>
                        
                        {exercise.completionStatus !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteExercise(exercise.id || `${index}`)}
                            className="ml-3 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1 px-2 rounded transition-colors"
                            title="Mark exercise as completed"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No workout planned for today</p>
            <button
              onClick={handleGenerateWorkout}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Today\'s Workout'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleViewHistory}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            View Workout History
          </button>
          <button
            onClick={() => handleGenerateWorkout()}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Quick 30min Strength Workout
          </button>
        </div>
      </div>
    </div>
  );
} 