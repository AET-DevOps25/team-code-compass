#!/usr/bin/env python3
"""
Integration Tests for User Service and Workout Plan Service
Tests the interaction between services using real HTTP calls
"""

import pytest
import requests
import json
import uuid
from datetime import datetime, date


class TestUserWorkoutIntegration:
    """Integration tests between User Service and Workout Plan Service"""
    
    BASE_USER_URL = "http://localhost:8081"
    BASE_WORKOUT_URL = "http://localhost:8082"
    
    @pytest.fixture(scope="class")
    def test_user_data(self):
        """Create test user data"""
        return {
            "username": f"integtest_{uuid.uuid4().hex[:8]}",
            "email": f"integtest_{uuid.uuid4().hex[:8]}@example.com",
            "password": "integration123",
            "firstName": "Integration",
            "lastName": "Test",
            "dateOfBirth": "1990-01-01",
            "age": 34,
            "gender": "MALE",
            "height": 175,
            "weight": 70
        }
    
    @pytest.fixture(scope="class")
    def registered_user(self, test_user_data):
        """Register a test user and return user data with ID and token"""
        # Register user
        response = requests.post(
            f"{self.BASE_USER_URL}/api/v1/users/register",
            json=test_user_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        user_response = response.json()
        
        # Login to get token
        login_response = requests.post(
            f"{self.BASE_USER_URL}/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            },
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        return {
            "id": user_response["id"],
            "token": login_data["token"],
            "user_data": user_response
        }
    
    def test_services_are_running(self):
        """Test that both services are accessible"""
        # Check user service health
        user_health = requests.get(f"{self.BASE_USER_URL}/health")
        assert user_health.status_code == 200
        
        # Check workout service health  
        workout_health = requests.get(f"{self.BASE_WORKOUT_URL}/health")
        assert workout_health.status_code == 200
    
    def test_user_registration_and_profile_access(self, test_user_data):
        """Test user registration and profile retrieval"""
        # Register user
        response = requests.post(
            f"{self.BASE_USER_URL}/api/v1/users/register",
            json=test_user_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        user_data = response.json()
        assert "id" in user_data
        assert user_data["email"] == test_user_data["email"]
        
        # Login
        login_response = requests.post(
            f"{self.BASE_USER_URL}/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "token" in login_data
        
        # Access profile with token
        headers = {"Authorization": f"Bearer {login_data['token']}"}
        profile_response = requests.get(
            f"{self.BASE_USER_URL}/api/v1/users/me",
            headers=headers
        )
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == test_user_data["email"]
    
    def test_workout_plan_generation_flow(self, registered_user):
        """Test complete workout plan generation flow"""
        headers = {"Authorization": f"Bearer {registered_user['token']}"}
        
        # Generate workout plan
        workout_request = {
            "userId": registered_user["id"],
            "dayDate": "2025-06-29",
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        workout_data = response.json()
        
        # Validate response structure
        assert "id" in workout_data
        assert workout_data["userId"] == registered_user["id"]
        assert workout_data["dayDate"] == "2025-06-29"
        assert workout_data["focusSportType"] == "STRENGTH"
        assert workout_data["targetDurationMinutes"] == 45
        assert "scheduledExercises" in workout_data
        assert len(workout_data["scheduledExercises"]) > 0
        
        # Validate exercise structure
        exercise = workout_data["scheduledExercises"][0]
        required_fields = [
            "id", "sequenceOrder", "exerciseName", "description",
            "applicableSportTypes", "muscleGroupsPrimary", "muscleGroupsSecondary",
            "equipmentNeeded", "difficulty", "prescribedSetsRepsDuration",
            "voiceScriptCueText", "videoUrl"
        ]
        for field in required_fields:
            assert field in exercise
    
    def test_multiple_sport_types(self, registered_user):
        """Test workout generation for different sport types"""
        headers = {"Authorization": f"Bearer {registered_user['token']}"}
        sport_types = ["STRENGTH", "HIIT", "YOGA"]
        
        for i, sport_type in enumerate(sport_types, 1):
            workout_request = {
                "userId": registered_user["id"],
                "dayDate": f"2025-06-{29 + i}",
                "focusSportType": sport_type,
                "targetDurationMinutes": 30 + (i * 10)
            }
            
            response = requests.post(
                f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
                json=workout_request,
                headers={**headers, "Content-Type": "application/json"}
            )
            
            assert response.status_code == 200
            workout_data = response.json()
            assert workout_data["focusSportType"] == sport_type
            assert len(workout_data["scheduledExercises"]) > 0
    
    def test_unauthorized_workout_generation(self):
        """Test that workout generation requires authentication"""
        workout_request = {
            "userId": str(uuid.uuid4()),
            "dayDate": "2025-06-29",
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        # Request without authorization header
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [401, 403]
    
    def test_invalid_user_id_in_workout_request(self, registered_user):
        """Test workout generation with invalid user ID"""
        headers = {"Authorization": f"Bearer {registered_user['token']}"}
        
        workout_request = {
            "userId": str(uuid.uuid4()),  # Different user ID
            "dayDate": "2025-06-29",
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        # Should either fail or use the authenticated user's ID
        if response.status_code == 200:
            workout_data = response.json()
            # If successful, should use the authenticated user's ID
            assert workout_data["userId"] == registered_user["id"]
        else:
            assert response.status_code in [400, 403, 404]
    
    def test_user_profile_in_workout_context(self, registered_user):
        """Test that user profile data is correctly used in workout generation"""
        headers = {"Authorization": f"Bearer {registered_user['token']}"}
        
        # Generate workout plan
        workout_request = {
            "userId": registered_user["id"],
            "dayDate": "2025-06-29",
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        workout_data = response.json()
        
        # The workout should be generated successfully, indicating that
        # the user profile was retrieved and used
        assert workout_data["userId"] == registered_user["id"]
        assert len(workout_data["scheduledExercises"]) > 0
        
        # Exercises should be appropriate for the user's profile
        exercises = workout_data["scheduledExercises"]
        for exercise in exercises:
            assert exercise["difficulty"] in ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
            assert len(exercise["muscleGroupsPrimary"]) > 0
    
    def test_concurrent_workout_generation(self, registered_user):
        """Test concurrent workout generation requests"""
        import concurrent.futures
        import threading
        
        headers = {"Authorization": f"Bearer {registered_user['token']}"}
        
        def generate_workout(day_offset):
            workout_request = {
                "userId": registered_user["id"],
                "dayDate": f"2025-07-{day_offset:02d}",
                "focusSportType": "STRENGTH",
                "targetDurationMinutes": 45
            }
            
            response = requests.post(
                f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
                json=workout_request,
                headers={**headers, "Content-Type": "application/json"}
            )
            return response.status_code == 200
        
        # Generate 3 workouts concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(generate_workout, i) for i in range(1, 4)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        assert all(results), "Some concurrent requests failed"
    
    def test_service_communication_resilience(self, registered_user):
        """Test that workout service handles user service communication properly"""
        headers = {"Authorization": f"Bearer {registered_user['token']}"}
        
        # This test verifies that the workout service can communicate with user service
        # by generating a workout plan that requires user profile data
        workout_request = {
            "userId": registered_user["id"],
            "dayDate": "2025-06-29",
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        # If this succeeds, it means:
        # 1. Workout service received the request
        # 2. Workout service successfully called user service to get profile
        # 3. Workout service successfully called GenAI service
        # 4. Workout service successfully saved to database
        assert response.status_code == 200
        
        workout_data = response.json()
        assert workout_data["userId"] == registered_user["id"]
        
        # Verify that the workout contains realistic data
        exercises = workout_data["scheduledExercises"]
        assert len(exercises) > 0
        
        for exercise in exercises:
            assert exercise["exerciseName"]  # Not empty
            assert exercise["description"]   # Not empty
            assert len(exercise["muscleGroupsPrimary"]) > 0
            assert exercise["prescribedSetsRepsDuration"]  # Not empty


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 