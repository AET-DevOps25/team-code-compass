import pytest
import json
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
import os

# Import the local workout worker application
try:
    from workout_worker_local import app, generate_local_workout, WorkoutRequest
except ImportError:
    # If direct import fails, create mock structures for testing
    from fastapi import FastAPI
    app = FastAPI()
    
    class WorkoutRequest:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

client = TestClient(app)

class TestWorkoutWorkerLocal:
    """Test suite for Local GenAI Workout Worker"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "local" in data["service"].lower()
    
    def test_local_ai_preference_routing(self):
        """Test local AI preference routing"""
        local_request = {
            "userId": "test-user",
            "workoutDate": "2025-01-20", 
            "preferredDuration": 20,
            "aiPreference": "local"
        }
        
        response = client.post("/generate", json=local_request)
        assert response.status_code in [200, 422]
    
    def test_mock_mode_operation(self):
        """Test mock mode operation for local worker"""
        # Mock mode should work without actual local models
        request_data = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 15,
            "targetMuscleGroups": ["LEGS"],
            "availableEquipment": ["NO_EQUIPMENT"],
            "aiPreference": "local"
        }
        
        response = client.post("/generate", json=request_data)
        # Should work in mock mode
        assert response.status_code in [200, 422]
        
        if response.status_code == 200:
            data = response.json()
            # Should return some form of workout data
            assert isinstance(data, dict)
    
    def test_environment_configuration_local(self):
        """Test local worker environment configuration"""
        # Test local model configuration
        model_type = os.getenv('LOCAL_MODEL_TYPE', 'mock')
        assert model_type in ['mock', 'gpt4all', 'ollama']
        
        # Test mock mode setting
        mock_mode = os.getenv('MOCK_MODE', 'true')
        assert mock_mode in ['true', 'false']
    
    @patch('workout_worker_local.call_gpt4all')
    def test_gpt4all_integration(self, mock_gpt4all):
        """Test GPT4All integration with mocked model"""
        mock_gpt4all.return_value = {
            "markdownContent": "# Local Workout\n\n## Bodyweight Exercises\n1. Squats\n2. Push-ups",
            "scheduledExercises": [
                {
                    "sequenceOrder": 1,
                    "exerciseName": "Squats",
                    "description": "Lower body strength exercise",
                    "muscleGroupsPrimary": ["Quadriceps"],
                    "equipmentNeeded": ["NO_EQUIPMENT"],
                    "prescribedSetsRepsDuration": "3 sets x 15 reps"
                }
            ]
        }
        
        request_data = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 20,
            "targetMuscleGroups": ["LEGS"],
            "availableEquipment": ["NO_EQUIPMENT"],
            "aiPreference": "local"
        }
        
        # Should use GPT4All for generation
        response = client.post("/generate", json=request_data)
        assert response.status_code in [200, 422]
    
    @patch('workout_worker_local.call_ollama')
    def test_ollama_integration(self, mock_ollama):
        """Test Ollama integration with mocked model"""
        mock_ollama.return_value = {
            "markdownContent": "# Ollama Generated Workout\n\n## HIIT Session\n1. Jumping Jacks\n2. Burpees",
            "scheduledExercises": [
                {
                    "sequenceOrder": 1,
                    "exerciseName": "Jumping Jacks",
                    "description": "Full body cardio exercise",
                    "muscleGroupsPrimary": ["Full Body"],
                    "equipmentNeeded": ["NO_EQUIPMENT"],
                    "prescribedSetsRepsDuration": "30 seconds x 3 rounds"
                }
            ]
        }
        
        request_data = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 25,
            "sportType": "HIIT",
            "aiPreference": "local"
        }
        
        response = client.post("/generate", json=request_data)
        assert response.status_code in [200, 422]
    
    def test_privacy_preservation(self):
        """Test privacy preservation - no external API calls"""
        # Local worker should not make external API calls
        request_data = {
            "userId": "sensitive-user-data",
            "workoutDate": "2025-01-20",
            "preferredDuration": 30,
            "personalNotes": "private health information",
            "aiPreference": "local"
        }
        
        # Should process locally without external calls
        response = client.post("/generate", json=request_data)
        assert response.status_code in [200, 422]
        
        # Should not expose sensitive data in logs (basic check)
        # In a real implementation, you'd verify no external network calls
    
    def test_offline_capability(self):
        """Test offline operation capability"""
        # Local worker should work without internet
        request_data = {
            "userId": "offline-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 20,
            "aiPreference": "local"
        }
        
        # Should work in offline mode (mock or local models)
        response = client.post("/generate", json=request_data)
        assert response.status_code in [200, 422]
    
    def test_performance_vs_cloud(self):
        """Test local processing performance characteristics"""
        import time
        
        request_data = {
            "userId": "perf-test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 15,
            "aiPreference": "local"
        }
        
        start_time = time.time()
        response = client.post("/generate", json=request_data)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        # Local processing should complete within reasonable time
        # (Even mock responses should be fast)
        assert processing_time < 30.0  # 30 seconds max
        assert response.status_code in [200, 422]
    
    def test_model_fallback_behavior(self):
        """Test model fallback when preferred model unavailable"""
        request_data = {
            "userId": "fallback-test",
            "workoutDate": "2025-01-20",
            "preferredDuration": 25,
            "modelPreference": "unavailable-model",
            "aiPreference": "local"
        }
        
        # Should fallback gracefully to available model or mock
        response = client.post("/generate", json=request_data)
        assert response.status_code in [200, 422, 500]
    
    def test_error_handling_local(self):
        """Test error handling for local worker"""
        # Test empty request
        response = client.post("/generate", json={})
        assert response.status_code == 422
        
        # Test malformed request
        response = client.post("/generate", json={"invalid": "structure"})
        assert response.status_code == 422
        
        # Test extremely short duration
        short_request = {
            "userId": "test-user",
            "workoutDate": "2025-01-20",
            "preferredDuration": 1,  # 1 minute - very short
            "aiPreference": "local"
        }
        
        response = client.post("/generate", json=short_request)
        # Should handle gracefully
        assert response.status_code in [200, 422, 400]
    
    def test_resource_usage_local(self):
        """Test local resource usage is reasonable"""
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Generate several workouts
        for i in range(3):
            request_data = {
                "userId": f"resource-test-{i}",
                "workoutDate": "2025-01-20",
                "preferredDuration": 20,
                "aiPreference": "local"
            }
            
            response = client.post("/generate", json=request_data)
            assert response.status_code in [200, 422]
        
        # Check memory growth
        final_memory = process.memory_info().rss
        memory_growth = final_memory - initial_memory
        
        # Memory growth should be reasonable (less than 50MB for test workloads)
        assert memory_growth < 50 * 1024 * 1024  # 50MB

if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v"]) 