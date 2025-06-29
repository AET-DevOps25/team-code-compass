#!/usr/bin/env python3
"""
System Tests for Complete End-to-End Functionality
Tests the entire system including all services, database, and external dependencies
"""

import requests
import json
import uuid
import time
from datetime import datetime, date, timedelta


class TestSystemEndToEnd:
    """System tests for complete end-to-end functionality"""
    
    BASE_USER_URL = "http://localhost:8081"
    BASE_WORKOUT_URL = "http://localhost:8082"
    BASE_GENAI_URL = "http://localhost:8083"
    
    def setup_method(self):
        """Setup method run before each test"""
        self.test_users = []
    
    def teardown_method(self):
        """Cleanup method run after each test"""
        # Clean up test users if needed
        pass
    
    def create_test_user(self, suffix=""):
        """Helper method to create a test user"""
        user_data = {
            "username": f"systemtest_{uuid.uuid4().hex[:8]}{suffix}",
            "email": f"systemtest_{uuid.uuid4().hex[:8]}{suffix}@example.com",
            "password": "system123",
            "firstName": "System",
            "lastName": f"Test{suffix}",
            "dateOfBirth": "1990-01-01",
            "age": 34,
            "gender": "MALE",
            "height": 175,
            "weight": 70
        }
        
        # Register user
        response = requests.post(
            f"{self.BASE_USER_URL}/api/v1/users/register",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        user_response = response.json()
        
        # Login to get token
        login_response = requests.post(
            f"{self.BASE_USER_URL}/auth/login",
            json={
                "email": user_data["email"],
                "password": user_data["password"]
            }
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        user_info = {
            "id": user_response["id"],
            "token": login_data["token"],
            "email": user_data["email"],
            "user_data": user_response
        }
        
        self.test_users.append(user_info)
        return user_info
    
    def test_complete_system_health(self):
        """Test that all system components are healthy"""
        services = [
            (self.BASE_USER_URL, "User Service"),
            (self.BASE_WORKOUT_URL, "Workout Plan Service"),
            (self.BASE_GENAI_URL, "GenAI Service")
        ]
        
        for base_url, service_name in services:
            try:
                response = requests.get(f"{base_url}/health", timeout=5)
                assert response.status_code == 200
                health_data = response.json()
                assert health_data["status"] == "healthy"
            except requests.exceptions.RequestException as e:
                assert False, f"{service_name} is not accessible: {e}"
    
    def test_user_journey_complete_flow(self):
        """Test complete user journey from registration to workout completion"""
        # Step 1: User Registration
        user = self.create_test_user("_journey")
        assert user["id"] is not None
        
        # Step 2: Generate Workout Plans
        headers = {"Authorization": f"Bearer {user['token']}"}
        sport_types = ["STRENGTH", "HIIT", "YOGA"]
        
        for i, sport_type in enumerate(sport_types):
            workout_request = {
                "userId": user["id"],
                "dayDate": (date.today() + timedelta(days=i)).strftime("%Y-%m-%d"),
                "focusSportType": sport_type,
                "targetDurationMinutes": 30 + (i * 15)
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
    
    def test_system_security_boundaries(self):
        """Test system security boundaries"""
        workout_request = {
            "userId": str(uuid.uuid4()),
            "dayDate": date.today().strftime("%Y-%m-%d"),
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        # Request without token
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [401, 403]
    
    def test_multi_user_system_isolation(self):
        """Test that multiple users can use the system simultaneously without interference"""
        # Create multiple users
        users = [self.create_test_user(f"_multi_{i}") for i in range(3)]
        
        # Generate workouts for all users simultaneously
        import concurrent.futures
        
        def generate_user_workout(user_info):
            headers = {"Authorization": f"Bearer {user_info['token']}"}
            workout_request = {
                "userId": user_info["id"],
                "dayDate": date.today().strftime("%Y-%m-%d"),
                "focusSportType": "STRENGTH",
                "targetDurationMinutes": 45
            }
            
            response = requests.post(
                f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
                json=workout_request,
                headers={**headers, "Content-Type": "application/json"}
            )
            
            return response.status_code == 200, user_info["id"], response.json() if response.status_code == 200 else None
        
        # Execute concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(generate_user_workout, user) for user in users]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # Verify all requests succeeded
        successful_results = [r for r in results if r[0]]
        assert len(successful_results) == 3, "Not all concurrent requests succeeded"
        
        # Verify data isolation - each workout belongs to correct user
        for success, user_id, workout_data in successful_results:
            assert workout_data["userId"] == user_id, "Workout assigned to wrong user"
    
    def test_system_performance_load(self):
        """Test system performance under load"""
        # Create a user for load testing
        user = self.create_test_user("_load")
        headers = {"Authorization": f"Bearer {user['token']}"}
        
        # Generate multiple workout requests
        def generate_workout(day_offset):
            workout_request = {
                "userId": user["id"],
                "dayDate": (date.today() + timedelta(days=day_offset)).strftime("%Y-%m-%d"),
                "focusSportType": "STRENGTH" if day_offset % 2 == 0 else "HIIT",
                "targetDurationMinutes": 45
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
                json=workout_request,
                headers={**headers, "Content-Type": "application/json"}
            )
            end_time = time.time()
            
            return {
                "success": response.status_code == 200,
                "response_time": end_time - start_time,
                "day_offset": day_offset
            }
        
        # Execute load test with 10 concurrent requests
        import concurrent.futures
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(generate_workout, i) for i in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # Analyze results
        successful_requests = [r for r in results if r["success"]]
        assert len(successful_requests) >= 8, "Too many requests failed under load"
        
        # Check response times (should be reasonable)
        avg_response_time = sum(r["response_time"] for r in successful_requests) / len(successful_requests)
        assert avg_response_time < 10.0, f"Average response time too high: {avg_response_time:.2f}s"
    
    def test_system_data_persistence(self):
        """Test that system data persists correctly across operations"""
        # Create user and generate workout
        user = self.create_test_user("_persistence")
        headers = {"Authorization": f"Bearer {user['token']}"}
        
        workout_request = {
            "userId": user["id"],
            "dayDate": date.today().strftime("%Y-%m-%d"),
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        # Generate workout
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        original_workout = response.json()
        original_workout_id = original_workout["id"]
        
        # Wait a moment and verify data is still accessible
        time.sleep(1)
        
        # Verify user profile is still accessible
        profile_response = requests.get(
            f"{self.BASE_USER_URL}/api/v1/users/me",
            headers=headers
        )
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["id"] == user["id"]
        
        # Generate another workout to ensure system is still functional
        workout_request["dayDate"] = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        response2 = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        assert response2.status_code == 200
        second_workout = response2.json()
        
        # Verify both workouts are different but belong to same user
        assert second_workout["id"] != original_workout_id
        assert second_workout["userId"] == user["id"]
        assert second_workout["dayDate"] != original_workout["dayDate"]
    
    def test_system_error_recovery(self):
        """Test system behavior under error conditions"""
        # Test with invalid user ID (should handle gracefully)
        fake_user_id = str(uuid.uuid4())
        user = self.create_test_user("_error")
        headers = {"Authorization": f"Bearer {user['token']}"}
        
        workout_request = {
            "userId": fake_user_id,  # Different from authenticated user
            "dayDate": date.today().strftime("%Y-%m-%d"),
            "focusSportType": "STRENGTH",
            "targetDurationMinutes": 45
        }
        
        response = requests.post(
            f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
            json=workout_request,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        # System should either reject the request or use the authenticated user's ID
        if response.status_code == 200:
            workout_data = response.json()
            # Should use authenticated user's ID, not the fake one
            assert workout_data["userId"] == user["id"]
        else:
            # Should return appropriate error status
            assert response.status_code in [400, 403, 404]
    
    def test_genai_service_integration(self):
        """Test GenAI service integration with the system"""
        # Test GenAI service directly
        genai_request = {
            "user_profile": {
                "age": 30,
                "gender": "MALE",
                "height_cm": 180,
                "weight_kg": 75
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE",
                "fitnessGoals": ["MUSCLE_GAIN"],
                "preferredSportTypes": ["STRENGTH"],
                "availableEquipment": ["DUMBBELLS"],
                "workoutDurationRange": "45 minutes",
                "intensityPreference": "MODERATE",
                "healthNotes": "No injuries",
                "dislikedExercises": []
            },
            "daily_focus": {
                "day_date": date.today().strftime("%Y-%m-%d"),
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }
        
        response = requests.post(
            f"{self.BASE_GENAI_URL}/generate",
            json=genai_request,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        genai_data = response.json()
        assert "daily_workout" in genai_data
        assert "scheduled_exercises" in genai_data["daily_workout"]
        assert len(genai_data["daily_workout"]["scheduled_exercises"]) > 0
        
        # Test that the workout service can communicate with GenAI
        user = self.create_test_user("_genai")
        headers = {"Authorization": f"Bearer {user['token']}"}
        
        workout_request = {
            "userId": user["id"],
            "dayDate": date.today().strftime("%Y-%m-%d"),
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
        
        # Verify that the workout contains data that could only come from GenAI
        exercises = workout_data["scheduledExercises"]
        assert len(exercises) > 0
        
        for exercise in exercises:
            # These fields should be populated by GenAI
            assert exercise["exerciseName"]
            assert exercise["description"]
            assert exercise["voiceScriptCueText"]
            assert exercise["videoUrl"]
            assert len(exercise["muscleGroupsPrimary"]) > 0
    
    def test_system_scalability_patterns(self):
        """Test system scalability patterns"""
        # Test multiple users with different sport types simultaneously
        sport_types = ["STRENGTH", "HIIT", "YOGA", "CARDIO"]
        users_per_sport = 2
        
        # Create users for each sport type
        all_users = []
        for sport_type in sport_types:
            for i in range(users_per_sport):
                user = self.create_test_user(f"_scale_{sport_type.lower()}_{i}")
                all_users.append((user, sport_type))
        
        # Generate workouts concurrently
        def generate_workout_for_user(user_sport_tuple):
            user, sport_type = user_sport_tuple
            headers = {"Authorization": f"Bearer {user['token']}"}
            
            workout_request = {
                "userId": user["id"],
                "dayDate": date.today().strftime("%Y-%m-%d"),
                "focusSportType": sport_type,
                "targetDurationMinutes": 45
            }
            
            response = requests.post(
                f"{self.BASE_WORKOUT_URL}/api/v1/plans/generate",
                json=workout_request,
                headers={**headers, "Content-Type": "application/json"}
            )
            
            return response.status_code == 200, sport_type, user["id"]
        
        import concurrent.futures
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(generate_workout_for_user, user_sport) for user_sport in all_users]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # Analyze results by sport type
        sport_results = {}
        for success, sport_type, user_id in results:
            if sport_type not in sport_results:
                sport_results[sport_type] = []
            sport_results[sport_type].append(success)
        
        # Verify all sport types were handled successfully
        for sport_type, successes in sport_results.items():
            success_rate = sum(successes) / len(successes)
            assert success_rate >= 0.8, f"Low success rate for {sport_type}: {success_rate:.2f}"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"]) 