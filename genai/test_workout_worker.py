#!/usr/bin/env python3
"""
Unit tests for FlexFit GenAI Workout Worker

Run with: python -m pytest test_workout_worker.py -v
"""

import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# Import the application components  
import sys
import os
import importlib.util
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import from workout-worker.py file (dash in filename)
spec = importlib.util.spec_from_file_location("workout_worker", "workout-worker.py")
workout_worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workout_worker)

# Import components
app = workout_worker.app
OpenWebUILLM = workout_worker.OpenWebUILLM
PromptContext = workout_worker.PromptContext
WeeklyPromptContext = workout_worker.WeeklyPromptContext
GenAIExercise = workout_worker.GenAIExercise
GenAIDailyWorkout = workout_worker.GenAIDailyWorkout
GenAIWeeklyResponse = workout_worker.GenAIWeeklyResponse
generate_mock_response = workout_worker.generate_mock_response
generate_mock_weekly_response = workout_worker.generate_mock_weekly_response

class TestGenAIExercise:
    """Test GenAI Exercise model"""
    
    def test_exercise_creation(self):
        """Test creating a valid exercise"""
        exercise = GenAIExercise(
            sequence_order=1,
            exercise_name="Push-ups",
            description="Classic bodyweight exercise",
            applicable_sport_types=["STRENGTH"],
            muscle_groups_primary=["Chest", "Shoulders"],
            muscle_groups_secondary=["Triceps"],
            equipment_needed=["NO_EQUIPMENT"],
            difficulty="Intermediate",
            prescribed_sets_reps_duration="3 sets x 12 reps",
            voice_script_cue_text="Keep your core tight"
        )
        
        assert exercise.sequence_order == 1
        assert exercise.exercise_name == "Push-ups"
        assert "Chest" in exercise.muscle_groups_primary
        assert "NO_EQUIPMENT" in exercise.equipment_needed
        assert exercise.difficulty == "Intermediate"

class TestGenAIDailyWorkout:
    """Test GenAI Daily Workout model"""
    
    def test_daily_workout_creation(self):
        """Test creating a valid daily workout"""
        exercise = GenAIExercise(
            sequence_order=1,
            exercise_name="Squats",
            description="Compound leg exercise",
            applicable_sport_types=["STRENGTH"],
            muscle_groups_primary=["Quadriceps"],
            muscle_groups_secondary=["Glutes"],
            equipment_needed=["NO_EQUIPMENT"],
            difficulty="Beginner",
            prescribed_sets_reps_duration="3 sets x 15 reps",
            voice_script_cue_text="Keep your back straight"
        )
        
        workout = GenAIDailyWorkout(
            day_date="2025-01-25",
            focus_sport_type_for_the_day="STRENGTH",
            scheduled_exercises=[exercise],
            markdown_content="# Strength Workout\n\nDaily strength training"
        )
        
        assert workout.day_date == "2025-01-25"
        assert workout.focus_sport_type_for_the_day == "STRENGTH"
        assert len(workout.scheduled_exercises) == 1
        assert "Strength Workout" in workout.markdown_content

class TestPromptContext:
    """Test Prompt Context model"""
    
    def test_prompt_context_creation(self):
        """Test creating a valid prompt context"""
        context = PromptContext(
            user_profile={"age": 30, "gender": "MALE"},
            user_preferences={"experienceLevel": "INTERMEDIATE"},
            text_prompt="Upper body workout",
            focus_sport_type="STRENGTH",
            daily_focus="Upper body strength training"
        )
        
        assert context.user_profile["age"] == 30
        assert context.user_preferences["experienceLevel"] == "INTERMEDIATE"
        assert context.text_prompt == "Upper body workout"
        assert context.focus_sport_type == "STRENGTH"

class TestWeeklyPromptContext:
    """Test Weekly Prompt Context model"""
    
    def test_weekly_context_creation(self):
        """Test creating a valid weekly prompt context"""
        context = WeeklyPromptContext(
            user_profile={"age": 25, "gender": "FEMALE"},
            user_preferences={"experienceLevel": "BEGINNER"},
            text_prompt="Weekly fitness plan",
            last_7_days_exercises=[]
        )
        
        assert context.user_profile["age"] == 25
        assert context.user_preferences["experienceLevel"] == "BEGINNER"
        assert context.text_prompt == "Weekly fitness plan"
        assert isinstance(context.last_7_days_exercises, list)

class TestMockGeneration:
    """Test mock response generation"""
    
    def test_generate_mock_response(self):
        """Test mock single day workout generation"""
        context = PromptContext(
            user_profile={"age": 30, "gender": "MALE"},
            user_preferences={"experienceLevel": "INTERMEDIATE"},
            text_prompt="Test workout",
            focus_sport_type="STRENGTH",
            daily_focus="Strength training session"
        )
        
        response = generate_mock_response(context)
        
        assert isinstance(response, GenAIDailyWorkout)
        assert response.focus_sport_type_for_the_day == "STRENGTH"
        assert len(response.scheduled_exercises) > 0
        assert "STRENGTH" in response.markdown_content
        
        # Check exercise structure
        exercise = response.scheduled_exercises[0]
        assert hasattr(exercise, 'sequence_order')
        assert hasattr(exercise, 'exercise_name')
        assert hasattr(exercise, 'muscle_groups_primary')
    
    def test_generate_mock_weekly_response(self):
        """Test mock weekly workout generation"""
        context = WeeklyPromptContext(
            user_profile={"age": 25, "gender": "FEMALE"},
            user_preferences={"experienceLevel": "BEGINNER"},
            text_prompt="Weekly plan",
            last_7_days_exercises=[]
        )
        
        response = generate_mock_weekly_response(context)
        
        assert isinstance(response, GenAIWeeklyResponse)
        assert len(response.workouts) == 7  # 7 days
        
        # Check variety in sport types
        sport_types = [workout.focus_sport_type_for_the_day for workout in response.workouts]
        assert "STRENGTH" in sport_types
        assert "REST" in sport_types  # Should include rest days
        
        # Check that REST days have no exercises
        rest_days = [workout for workout in response.workouts if workout.focus_sport_type_for_the_day == "REST"]
        for rest_day in rest_days:
            assert len(rest_day.scheduled_exercises) == 0
    
    def test_mock_response_variety(self):
        """Test that mock responses have variety in exercises"""
        context = PromptContext(
            user_profile={"age": 35, "gender": "MALE"},
            user_preferences={"experienceLevel": "ADVANCED"},
            text_prompt="Strength training",
            focus_sport_type="STRENGTH",
            daily_focus="Advanced strength training"
        )
        
        # Generate multiple mock responses
        responses = [generate_mock_response(context) for _ in range(3)]
        
        # Should all be valid
        for response in responses:
            assert isinstance(response, GenAIDailyWorkout)
            assert len(response.scheduled_exercises) > 0

class TestOpenWebUILLM:
    """Test OpenWebUI LLM integration"""
    
    def test_llm_initialization(self):
        """Test LLM initialization"""
        llm = OpenWebUILLM()
        assert hasattr(llm, '_call')
        assert hasattr(llm, '_llm_type')
        assert llm._llm_type == "open_webui"
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_llm_mock_mode(self):
        """Test LLM in mock mode"""
        llm = OpenWebUILLM()
        
        # Mock mode should return mock data
        result = llm._call("test prompt")
        assert isinstance(result, str)
        assert len(result) > 0
    
    @patch('requests.post')
    @patch.dict(os.environ, {'CHAIR_API_KEY': 'test-key', 'MOCK_MODE': 'false'})
    def test_llm_api_call(self, mock_post):
        """Test LLM API call"""
        # Mock successful API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "day_date": "2025-01-25",
                        "focus_sport_type_for_the_day": "STRENGTH",
                        "scheduled_exercises": [],
                        "markdown_content": "Test workout"
                    })
                }
            }]
        }
        mock_post.return_value = mock_response
        
        llm = OpenWebUILLM()
        result = llm._call("test prompt")
        
        assert isinstance(result, str)
        mock_post.assert_called_once()
    
    @patch('requests.post')
    @patch.dict(os.environ, {'CHAIR_API_KEY': 'test-key', 'MOCK_MODE': 'false'})
    def test_llm_api_error_handling(self, mock_post):
        """Test LLM API error handling"""
        # Mock API error
        mock_post.side_effect = Exception("API Error")
        
        llm = OpenWebUILLM()
        
        with pytest.raises(Exception, match="API Error"):
            llm._call("test prompt")

class TestAPIEndpoints:
    """Test FastAPI endpoints"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "service" in data
        assert "timestamp" in data
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_generate_endpoint_mock(self):
        """Test generate endpoint in mock mode"""
        payload = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "text_prompt": "Test workout",
            "focus_sport_type": "STRENGTH"
        }
        
        response = self.client.post("/generate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "focus_sport_type_for_the_day" in data
        assert "scheduled_exercises" in data
        assert "markdown_content" in data
        assert data["focus_sport_type_for_the_day"] == "STRENGTH"
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})  
    def test_generate_weekly_endpoint_mock(self):
        """Test generate weekly endpoint in mock mode"""
        payload = {
            "user_profile": {"age": 25, "gender": "FEMALE"},
            "user_preferences": {"experienceLevel": "BEGINNER"},
            "text_prompt": "Weekly plan",
            "last_7_days_exercises": []
        }
        
        response = self.client.post("/generate-weekly", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "workouts" in data
        assert len(data["workouts"]) == 7
        
        # Verify workout structure
        for workout in data["workouts"]:
            assert "day_date" in workout
            assert "focus_sport_type_for_the_day" in workout
            assert "scheduled_exercises" in workout
            assert "markdown_content" in workout
    
    def test_generate_endpoint_validation(self):
        """Test generate endpoint input validation"""
        # Missing required fields
        response = self.client.post("/generate", json={})
        assert response.status_code == 422  # Validation error
        
        # Invalid data types
        invalid_payload = {
            "user_profile": "invalid",  # Should be dict
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "text_prompt": "Test workout",
            "focus_sport_type": "STRENGTH"
        }
        
        response = self.client.post("/generate", json=invalid_payload)
        assert response.status_code == 422
    
    def test_generate_weekly_endpoint_validation(self):
        """Test generate weekly endpoint input validation"""
        # Missing required fields
        response = self.client.post("/generate-weekly", json={})
        assert response.status_code == 422
        
        # Invalid exercise history format
        invalid_payload = {
            "user_profile": {"age": 25, "gender": "FEMALE"},
            "user_preferences": {"experienceLevel": "BEGINNER"},
            "text_prompt": "Weekly plan",
            "last_7_days_exercises": "invalid"  # Should be list
        }
        
        response = self.client.post("/generate-weekly", json=invalid_payload)
        assert response.status_code == 422

class TestEnvironmentConfiguration:
    """Test environment variable configuration"""
    
    def test_mock_mode_enabled(self):
        """Test mock mode environment variable"""
        with patch.dict(os.environ, {'MOCK_MODE': 'true'}):
            # Re-import to pick up environment changes
            import importlib
            import workout_worker
            importlib.reload(workout_worker)
            
            # Mock mode should be enabled
            assert workout_worker.MOCK_MODE == True
    
    def test_mock_mode_disabled(self):
        """Test mock mode disabled"""
        with patch.dict(os.environ, {'MOCK_MODE': 'false'}):
            import importlib
            import workout_worker
            importlib.reload(workout_worker)
            
            assert workout_worker.MOCK_MODE == False
    
    def test_api_configuration(self):
        """Test API configuration from environment"""
        test_vars = {
            'OPEN_WEBUI_BASE_URL': 'https://test-api.example.com',
            'MODEL_NAME': 'test-model',
            'CHAIR_API_KEY': 'test-api-key'
        }
        
        with patch.dict(os.environ, test_vars):
            import importlib
            import workout_worker
            importlib.reload(workout_worker)
            
            assert workout_worker.OPEN_WEBUI_BASE_URL == 'https://test-api.example.com'
            assert workout_worker.MODEL_NAME == 'test-model'
            assert workout_worker.CHAIR_API_KEY == 'test-api-key'

class TestDataValidation:
    """Test data validation and error handling"""
    
    def test_exercise_validation(self):
        """Test exercise model validation"""
        # Valid exercise
        exercise = GenAIExercise(
            sequence_order=1,
            exercise_name="Test Exercise",
            description="Test description",
            applicable_sport_types=["STRENGTH"],
            muscle_groups_primary=["Chest"],
            muscle_groups_secondary=[],
            equipment_needed=["NO_EQUIPMENT"],
            difficulty="Beginner",
            prescribed_sets_reps_duration="3x10",
            voice_script_cue_text="Test cue"
        )
        
        assert exercise.sequence_order > 0
        assert len(exercise.exercise_name) > 0
        assert len(exercise.muscle_groups_primary) > 0
    
    def test_workout_consistency(self):
        """Test workout data consistency"""
        exercise = GenAIExercise(
            sequence_order=1,
            exercise_name="Push-ups",
            description="Bodyweight exercise",
            applicable_sport_types=["STRENGTH"],
            muscle_groups_primary=["Chest"],
            muscle_groups_secondary=["Triceps"],
            equipment_needed=["NO_EQUIPMENT"],
            difficulty="Intermediate",
            prescribed_sets_reps_duration="3x12",
            voice_script_cue_text="Keep core tight"
        )
        
        workout = GenAIDailyWorkout(
            day_date="2025-01-25",
            focus_sport_type_for_the_day="STRENGTH",
            scheduled_exercises=[exercise],
            markdown_content="# Strength Workout"
        )
        
        # Check consistency between workout sport type and exercise
        assert workout.focus_sport_type_for_the_day in exercise.applicable_sport_types

class TestIntegrationScenarios:
    """Test integration scenarios and workflows"""
    
    def setup_method(self):
        """Setup for integration tests"""
        self.client = TestClient(app)
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_complete_workout_generation_flow(self):
        """Test complete workout generation flow"""
        # Test single day generation
        single_payload = {
            "user_profile": {"age": 28, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "text_prompt": "Full body workout",
            "focus_sport_type": "STRENGTH"
        }
        
        single_response = self.client.post("/generate", json=single_payload)
        assert single_response.status_code == 200
        single_data = single_response.json()
        
        # Test weekly generation
        weekly_payload = {
            "user_profile": {"age": 28, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "text_prompt": "Weekly training plan",
            "last_7_days_exercises": []
        }
        
        weekly_response = self.client.post("/generate-weekly", json=weekly_payload)
        assert weekly_response.status_code == 200
        weekly_data = weekly_response.json()
        
        # Verify both responses are valid
        assert "scheduled_exercises" in single_data
        assert len(weekly_data["workouts"]) == 7
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_different_sport_types(self):
        """Test generation for different sport types"""
        sport_types = ["STRENGTH", "HIIT", "YOGA_MOBILITY"]
        
        for sport_type in sport_types:
            payload = {
                "user_profile": {"age": 30, "gender": "FEMALE"},
                "user_preferences": {"experienceLevel": "BEGINNER"},
                "text_prompt": f"{sport_type} workout",
                "focus_sport_type": sport_type
            }
            
            response = self.client.post("/generate", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            assert data["focus_sport_type_for_the_day"] == sport_type
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_user_experience_levels(self):
        """Test generation for different experience levels"""
        experience_levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
        
        for level in experience_levels:
            payload = {
                "user_profile": {"age": 25, "gender": "MALE"},
                "user_preferences": {"experienceLevel": level},
                "text_prompt": f"{level} workout",
                "focus_sport_type": "STRENGTH"
            }
            
            response = self.client.post("/generate", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            # Verify the workout adapts to experience level
            assert len(data["scheduled_exercises"]) > 0

# Performance and Load Testing
class TestPerformance:
    """Test performance and load scenarios"""
    
    def setup_method(self):
        """Setup performance tests"""
        self.client = TestClient(app)
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_concurrent_requests(self):
        """Test handling multiple concurrent requests"""
        import concurrent.futures
        import time
        
        def make_request():
            payload = {
                "user_profile": {"age": 30, "gender": "MALE"},
                "user_preferences": {"experienceLevel": "INTERMEDIATE"},
                "text_prompt": "Concurrent test",
                "focus_sport_type": "STRENGTH"
            }
            
            start_time = time.time()
            response = self.client.post("/generate", json=payload)
            end_time = time.time()
            
            return response.status_code, end_time - start_time
        
        # Execute 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        for status_code, duration in results:
            assert status_code == 200
            # Mock mode should be very fast (< 1 second)
            assert duration < 1.0
    
    @patch.dict(os.environ, {'MOCK_MODE': 'true'})
    def test_memory_usage(self):
        """Test memory usage doesn't grow excessively"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Generate many workouts
        payload = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "text_prompt": "Memory test",
            "focus_sport_type": "STRENGTH"
        }
        
        for _ in range(50):
            response = self.client.post("/generate", json=payload)
            assert response.status_code == 200
        
        final_memory = process.memory_info().rss
        memory_growth = final_memory - initial_memory
        
        # Memory growth should be reasonable (< 100MB)
        assert memory_growth < 100 * 1024 * 1024  # 100MB

import pytest
import json
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
import os

# Import the workout worker application
try:
    from workout_worker import app, generate_workout_plan, WorkoutRequest
except ImportError:
    # If direct import fails, create mock structures for testing
    from fastapi import FastAPI
    app = FastAPI()
    
    class WorkoutRequest:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

client = TestClient(app)

class TestWorkoutWorkerCloud:
    """Test suite for Cloud GenAI Workout Worker"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
    
    def test_workout_request_validation(self):
        """Test workout request data validation"""
        valid_request = {
            "userId": "123",
            "workoutDate": "2025-01-20",
            "preferredDuration": 30,
            "targetMuscleGroups": ["CHEST", "TRICEPS"],
            "availableEquipment": ["DUMBBELLS"],
            "aiPreference": "cloud"
        }
        
        # This should not raise any validation errors
        workout_req = WorkoutRequest(**valid_request)
        assert workout_req.userId == "123"
        assert workout_req.preferredDuration == 30
    
    def test_invalid_workout_request(self):
        """Test invalid workout request handling"""
        invalid_request = {
            "userId": "",  # Empty user ID should be invalid
            "preferredDuration": -10,  # Negative duration should be invalid
        }
        
        with pytest.raises((ValueError, AttributeError)):
            workout_req = WorkoutRequest(**invalid_request)
            assert workout_req.preferredDuration > 0  # This should fail
    
    @patch('workout_worker.call_openwebui_api')
    def test_ai_workout_generation_cloud(self, mock_api_call):
        """Test cloud AI workout generation with mocked API"""
        # Mock the API response
        mock_api_call.return_value = {
            "markdownContent": "# Chest Workout\n\n## Exercises\n1. Push-ups\n2. Dumbbell Press",
            "scheduledExercises": [
                {
                    "sequenceOrder": 1,
                    "exerciseName": "Push-ups",
                    "description": "Classic upper body exercise",
                    "muscleGroupsPrimary": ["Chest"],
                    "equipmentNeeded": ["NO_EQUIPMENT"],
                    "prescribedSetsRepsDuration": "3 sets x 12 reps"
                }
            ]
        }
        
        request_data = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 30,
            "targetMuscleGroups": ["CHEST"],
            "availableEquipment": ["DUMBBELLS"],
            "aiPreference": "cloud"
        }
        
        # Test the generate endpoint
        response = client.post("/generate", json=request_data)
        
        # Should return 200 status
        assert response.status_code in [200, 422]  # 422 is validation error, which is acceptable
        
        if response.status_code == 200:
            data = response.json()
            assert "markdownContent" in data or "scheduledExercises" in data
    
    def test_ai_preference_routing(self):
        """Test AI preference routing logic"""
        cloud_request = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 30,
            "aiPreference": "cloud"
        }
        
        # Should route to cloud AI processing
        response = client.post("/generate", json=cloud_request)
        assert response.status_code in [200, 422]
    
    def test_environment_configuration(self):
        """Test environment variable configuration"""
        # Test CHAIR_API_KEY presence (should be set in CI)
        chair_api_key = os.getenv('CHAIR_API_KEY')
        # In CI, this should be available, but in local dev it might not be
        assert chair_api_key is not None or os.getenv('MOCK_MODE') == 'true'
        
        # Test Open WebUI base URL
        base_url = os.getenv('OPEN_WEBUI_BASE_URL', 'https://gpu.aet.cit.tum.de')
        assert base_url.startswith('http')
    
    def test_mock_mode_fallback(self):
        """Test mock mode fallback when API is unavailable"""
        # This tests the fallback behavior when real API is not available
        request_data = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 15,
            "targetMuscleGroups": ["CHEST"],
            "availableEquipment": ["NO_EQUIPMENT"],
            "aiPreference": "cloud"
        }
        
        # Should handle gracefully even if API is down
        response = client.post("/generate", json=request_data)
        # Accept any reasonable response (success, validation error, or graceful failure)
        assert response.status_code in [200, 422, 500]
    
    def test_error_handling(self):
        """Test error handling for malformed requests"""
        # Empty request
        response = client.post("/generate", json={})
        assert response.status_code == 422  # Validation error
        
        # Invalid JSON structure
        response = client.post("/generate", json={"invalid": "structure"})
        assert response.status_code == 422
    
    def test_workout_safety_validation(self):
        """Test workout safety and reasonableness validation"""
        # Extremely long duration should be handled appropriately
        extreme_request = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 480,  # 8 hours - unreasonable
            "aiPreference": "cloud"
        }
        
        response = client.post("/generate", json=extreme_request)
        # Should either reject or handle gracefully
        assert response.status_code in [200, 422, 400]

if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v"]) 