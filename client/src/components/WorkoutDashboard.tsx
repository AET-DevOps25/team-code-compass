import React, { useState } from 'react';
import { useWorkout, useWorkoutGeneration } from '../hooks/useWorkout';
import { useTts } from '../hooks/useTts';
import { SportType } from '../types/workout';
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

  const {
    isGenerating: isGeneratingAudio,
    isSynthesizing,
    error: ttsError,
    audioUrl,
    audioBlob,
    availableVoices,
    isLoadingVoices,
    generateAudio,
    synthesizeAudio,
    loadAvailableVoices,
    clearError: clearTtsError,
    clearAudio
  } = useTts();

  const [selectedSport, setSelectedSport] = useState<SportType>(SportType.STRENGTH);
  const [duration, setDuration] = useState(30);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('en-US-Neural2-F');

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

  const handleGenerateAudio = async () => {
    if (!currentWorkout?.markdownContent) {
      return;
    }

    // Convert markdown to plain text for TTS
    const plainText = currentWorkout.markdownContent
      .replace(/[#*`]/g, '') // Remove markdown formatting
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    if (!plainText) {
      return;
    }

    await synthesizeAudio({
      text: plainText,
      voiceName: selectedVoice,
      languageCode: 'en-US',
      audioEncoding: 'MP3'
    });
  };

  const handleDownloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout-voice-over-${new Date().toISOString().split('T')[0]}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

      {ttsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{ttsError}</span>
            <button 
              onClick={clearTtsError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Workout Generation Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">AI Workout Assistant</h2>
        
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

      {/* Workout Voice-Over Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Workout Voice-Over</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Selection
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en-US-Neural2-F">Female Voice (US)</option>
            <option value="en-US-Neural2-M">Male Voice (US)</option>
            <option value="en-US-Neural2-A">Neutral Voice (US)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleGenerateAudio}
            disabled={isGeneratingAudio || isSynthesizing || !currentWorkout?.markdownContent}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {isGeneratingAudio || isSynthesizing ? 'Generating Audio...' : 'Generate Voice-Over'}
          </button>
          
          {audioUrl && (
            <button
              onClick={handleDownloadAudio}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Download Audio
            </button>
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Audio Preview:</h3>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
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
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {currentWorkout.focusSportTypeForTheDay.replace('_', ' ')}
              </span>
              <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded ml-2">
                {currentWorkout.completionStatus}
              </span>
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
                    <div key={exercise.id || index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">{exercise.sequenceOrder}. {exercise.exerciseName}</h4>
                      <p className="text-sm text-gray-600 mb-1">{exercise.description}</p>
                      <p className="text-sm text-blue-600">{exercise.prescribedSetsRepsDuration}</p>
                      {exercise.difficulty && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded mt-1">
                          {exercise.difficulty}
                        </span>
                      )}
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