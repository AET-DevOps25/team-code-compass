#!/usr/bin/env python3
"""
Unit tests for the GenAI Workout Worker
Tests the workout generation logic, validation, and error handling
"""

import pytest
import json
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from fastapi import HTTPException

# Import the main application
from workout_worker import app, generate_workout_response, validate_prompt_context, create_mock_workout

client = TestClient(app)


class TestWorkoutWorkerAPI:
    """Test the FastAPI endpoints"""

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "timestamp" in response.json()

    def test_generate_endpoint_valid_request(self):
        """Test workout generation with valid request"""
        valid_request = {
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
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        response = client.post("/generate", json=valid_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "daily_workout" in data
        assert "scheduled_exercises" in data["daily_workout"]
        assert len(data["daily_workout"]["scheduled_exercises"]) > 0
        
        # Validate exercise structure
        exercise = data["daily_workout"]["scheduled_exercises"][0]
        required_fields = [
            "sequence_order", "exercise_name", "description",
            "applicable_sport_types", "muscle_groups_primary",
            "muscle_groups_secondary", "equipment_needed",
            "difficulty", "prescribed_sets_reps_duration",
            "voice_script_cue_text", "video_url"
        ]
        for field in required_fields:
            assert field in exercise

    def test_generate_endpoint_missing_user_profile(self):
        """Test workout generation with missing user_profile"""
        invalid_request = {
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE"
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        response = client.post("/generate", json=invalid_request)
        assert response.status_code == 400

    def test_generate_endpoint_missing_daily_focus(self):
        """Test workout generation with missing daily_focus"""
        invalid_request = {
            "user_profile": {
                "age": 30,
                "gender": "MALE",
                "height_cm": 180,
                "weight_kg": 75
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE"
            }
        }

        response = client.post("/generate", json=invalid_request)
        assert response.status_code == 400

    def test_generate_endpoint_empty_request(self):
        """Test workout generation with empty request"""
        response = client.post("/generate", json={})
        assert response.status_code == 400

    def test_generate_endpoint_malformed_json(self):
        """Test workout generation with malformed JSON"""
        response = client.post("/generate", data="invalid json")
        assert response.status_code == 422

    def test_hiit_workout_generation(self):
        """Test HIIT workout generation"""
        hiit_request = {
            "user_profile": {
                "age": 25,
                "gender": "FEMALE",
                "height_cm": 165,
                "weight_kg": 60
            },
            "user_preferences": {
                "experienceLevel": "BEGINNER",
                "fitnessGoals": ["WEIGHT_LOSS"],
                "preferredSportTypes": ["HIIT"],
                "availableEquipment": ["NO_EQUIPMENT"],
                "workoutDurationRange": "30 minutes",
                "intensityPreference": "HIGH",
                "healthNotes": "No injuries",
                "dislikedExercises": []
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "HIIT",
                "target_total_duration_minutes": 30
            }
        }

        response = client.post("/generate", json=hiit_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["daily_workout"]["focus_sport_type"] == "HIIT"
        assert data["daily_workout"]["target_total_duration_minutes"] == 30
        assert len(data["daily_workout"]["scheduled_exercises"]) > 0

    def test_yoga_workout_generation(self):
        """Test YOGA workout generation"""
        yoga_request = {
            "user_profile": {
                "age": 40,
                "gender": "FEMALE",
                "height_cm": 170,
                "weight_kg": 65
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE",
                "fitnessGoals": ["FLEXIBILITY"],
                "preferredSportTypes": ["YOGA"],
                "availableEquipment": ["YOGA_MAT"],
                "workoutDurationRange": "50 minutes",
                "intensityPreference": "LOW",
                "healthNotes": "Lower back sensitivity",
                "dislikedExercises": []
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "YOGA",
                "target_total_duration_minutes": 50
            }
        }

        response = client.post("/generate", json=yoga_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["daily_workout"]["focus_sport_type"] == "YOGA"
        assert data["daily_workout"]["target_total_duration_minutes"] == 50
        assert len(data["daily_workout"]["scheduled_exercises"]) > 0


class TestValidatePromptContext:
    """Test the prompt context validation function"""

    def test_validate_valid_context(self):
        """Test validation with valid context"""
        valid_context = {
            "user_profile": {
                "age": 30,
                "gender": "MALE",
                "height_cm": 180,
                "weight_kg": 75
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE"
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        # Should not raise any exception
        validate_prompt_context(valid_context)

    def test_validate_missing_user_profile(self):
        """Test validation with missing user_profile"""
        invalid_context = {
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        with pytest.raises(HTTPException) as exc_info:
            validate_prompt_context(invalid_context)
        assert exc_info.value.status_code == 400
        assert "user_profile" in str(exc_info.value.detail)

    def test_validate_missing_daily_focus(self):
        """Test validation with missing daily_focus"""
        invalid_context = {
            "user_profile": {
                "age": 30,
                "gender": "MALE"
            },
            "user_preferences": {"experienceLevel": "INTERMEDIATE"}
        }

        with pytest.raises(HTTPException) as exc_info:
            validate_prompt_context(invalid_context)
        assert exc_info.value.status_code == 400
        assert "daily_focus" in str(exc_info.value.detail)

    def test_validate_invalid_age(self):
        """Test validation with invalid age"""
        invalid_context = {
            "user_profile": {
                "age": -5,  # Invalid age
                "gender": "MALE"
            },
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        with pytest.raises(HTTPException) as exc_info:
            validate_prompt_context(invalid_context)
        assert exc_info.value.status_code == 400
        assert "age" in str(exc_info.value.detail)

    def test_validate_invalid_duration(self):
        """Test validation with invalid target duration"""
        invalid_context = {
            "user_profile": {
                "age": 30,
                "gender": "MALE"
            },
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 0  # Invalid duration
            }
        }

        with pytest.raises(HTTPException) as exc_info:
            validate_prompt_context(invalid_context)
        assert exc_info.value.status_code == 400
        assert "target_total_duration_minutes" in str(exc_info.value.detail)


class TestCreateMockWorkout:
    """Test the mock workout creation function"""

    def test_create_strength_workout(self):
        """Test creation of STRENGTH workout"""
        context = {
            "user_profile": {
                "age": 30,
                "gender": "MALE",
                "height_cm": 180,
                "weight_kg": 75
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE",
                "preferredSportTypes": ["STRENGTH"]
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        workout = create_mock_workout(context)
        
        assert workout["day_date"] == "2025-06-29"
        assert workout["focus_sport_type"] == "STRENGTH"
        assert workout["target_total_duration_minutes"] == 45
        assert len(workout["scheduled_exercises"]) == 3
        
        # Check that exercises are appropriate for STRENGTH
        exercise_names = [ex["exercise_name"] for ex in workout["scheduled_exercises"]]
        assert "Push-ups" in exercise_names
        assert "Squats" in exercise_names
        assert "Plank" in exercise_names

    def test_create_hiit_workout(self):
        """Test creation of HIIT workout"""
        context = {
            "user_profile": {
                "age": 25,
                "gender": "FEMALE",
                "height_cm": 165,
                "weight_kg": 60
            },
            "user_preferences": {
                "experienceLevel": "BEGINNER",
                "preferredSportTypes": ["HIIT"]
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "HIIT",
                "target_total_duration_minutes": 30
            }
        }

        workout = create_mock_workout(context)
        
        assert workout["focus_sport_type"] == "HIIT"
        assert workout["target_total_duration_minutes"] == 30
        assert len(workout["scheduled_exercises"]) == 3
        
        # Check that exercises are appropriate for HIIT
        exercise_names = [ex["exercise_name"] for ex in workout["scheduled_exercises"]]
        assert "Burpees" in exercise_names
        assert "Mountain Climbers" in exercise_names
        assert "Jump Squats" in exercise_names

    def test_create_yoga_workout(self):
        """Test creation of YOGA workout"""
        context = {
            "user_profile": {
                "age": 40,
                "gender": "FEMALE",
                "height_cm": 170,
                "weight_kg": 65
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE",
                "preferredSportTypes": ["YOGA"]
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "YOGA",
                "target_total_duration_minutes": 50
            }
        }

        workout = create_mock_workout(context)
        
        assert workout["focus_sport_type"] == "YOGA"
        assert workout["target_total_duration_minutes"] == 50
        assert len(workout["scheduled_exercises"]) == 3
        
        # Check that exercises are appropriate for YOGA
        exercise_names = [ex["exercise_name"] for ex in workout["scheduled_exercises"]]
        assert "Downward Dog" in exercise_names
        assert "Warrior I" in exercise_names
        assert "Child's Pose" in exercise_names

    def test_exercise_structure_completeness(self):
        """Test that all exercises have required fields"""
        context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        workout = create_mock_workout(context)
        
        required_fields = [
            "sequence_order", "exercise_name", "description",
            "applicable_sport_types", "muscle_groups_primary",
            "muscle_groups_secondary", "equipment_needed",
            "difficulty", "prescribed_sets_reps_duration",
            "voice_script_cue_text", "video_url"
        ]
        
        for exercise in workout["scheduled_exercises"]:
            for field in required_fields:
                assert field in exercise, f"Missing field {field} in exercise {exercise['exercise_name']}"
            
            # Validate data types
            assert isinstance(exercise["sequence_order"], int)
            assert isinstance(exercise["exercise_name"], str)
            assert isinstance(exercise["description"], str)
            assert isinstance(exercise["applicable_sport_types"], list)
            assert isinstance(exercise["muscle_groups_primary"], list)
            assert isinstance(exercise["muscle_groups_secondary"], list)
            assert isinstance(exercise["equipment_needed"], list)
            assert isinstance(exercise["difficulty"], str)
            assert isinstance(exercise["prescribed_sets_reps_duration"], str)
            assert isinstance(exercise["voice_script_cue_text"], str)
            assert isinstance(exercise["video_url"], str)

    def test_age_based_adaptation(self):
        """Test that workouts adapt based on user age"""
        # Senior user context
        senior_context = {
            "user_profile": {"age": 70, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "BEGINNER"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 30
            }
        }

        # Young user context
        young_context = {
            "user_profile": {"age": 20, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "ADVANCED"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 60
            }
        }

        senior_workout = create_mock_workout(senior_context)
        young_workout = create_mock_workout(young_context)

        # Senior workouts should have easier difficulty
        senior_difficulties = [ex["difficulty"] for ex in senior_workout["scheduled_exercises"]]
        young_difficulties = [ex["difficulty"] for ex in young_workout["scheduled_exercises"]]

        # At least some exercises should be easier for seniors
        assert "BEGINNER" in senior_difficulties
        # Young users might have more advanced exercises
        assert any(diff in ["INTERMEDIATE", "ADVANCED"] for diff in young_difficulties)

    def test_experience_level_adaptation(self):
        """Test that workouts adapt based on experience level"""
        beginner_context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "BEGINNER"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 30
            }
        }

        advanced_context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "ADVANCED"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 60
            }
        }

        beginner_workout = create_mock_workout(beginner_context)
        advanced_workout = create_mock_workout(advanced_context)

        # Beginner workouts should generally be easier
        beginner_difficulties = [ex["difficulty"] for ex in beginner_workout["scheduled_exercises"]]
        advanced_difficulties = [ex["difficulty"] for ex in advanced_workout["scheduled_exercises"]]

        # Most beginner exercises should be BEGINNER level
        beginner_count = beginner_difficulties.count("BEGINNER")
        assert beginner_count >= 2

        # Advanced users should have more challenging exercises
        advanced_count = sum(1 for diff in advanced_difficulties if diff in ["INTERMEDIATE", "ADVANCED"])
        assert advanced_count >= 1


class TestGenerateWorkoutResponse:
    """Test the main workout generation function"""

    def test_generate_workout_response_success(self):
        """Test successful workout response generation"""
        context = {
            "user_profile": {
                "age": 30,
                "gender": "MALE",
                "height_cm": 180,
                "weight_kg": 75
            },
            "user_preferences": {
                "experienceLevel": "INTERMEDIATE",
                "fitnessGoals": ["MUSCLE_GAIN"],
                "preferredSportTypes": ["STRENGTH"]
            },
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        response = generate_workout_response(context)
        
        assert "daily_workout" in response
        daily_workout = response["daily_workout"]
        
        assert daily_workout["day_date"] == "2025-06-29"
        assert daily_workout["focus_sport_type"] == "STRENGTH"
        assert daily_workout["target_total_duration_minutes"] == 45
        assert "scheduled_exercises" in daily_workout
        assert len(daily_workout["scheduled_exercises"]) > 0

    def test_generate_workout_response_invalid_context(self):
        """Test workout generation with invalid context"""
        invalid_context = {
            "user_profile": {"age": -5}  # Invalid age
        }

        with pytest.raises(HTTPException):
            generate_workout_response(invalid_context)

    @patch('workout_worker.requests.post')
    def test_external_api_failure_fallback(self, mock_post):
        """Test fallback to mock when external API fails"""
        # Mock external API failure
        mock_post.side_effect = Exception("API unavailable")
        
        context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 45
            }
        }

        # Should fallback to mock without raising exception
        response = generate_workout_response(context)
        assert "daily_workout" in response
        assert len(response["daily_workout"]["scheduled_exercises"]) > 0


class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_missing_sport_type(self):
        """Test handling of missing sport type"""
        context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                # Missing focus_sport_type_for_the_day
                "target_total_duration_minutes": 45
            }
        }

        with pytest.raises(HTTPException) as exc_info:
            validate_prompt_context(context)
        assert exc_info.value.status_code == 400

    def test_invalid_sport_type(self):
        """Test handling of invalid sport type"""
        context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "INVALID_SPORT",
                "target_total_duration_minutes": 45
            }
        }

        # Should default to STRENGTH and not raise exception
        workout = create_mock_workout(context)
        assert workout["focus_sport_type"] == "INVALID_SPORT"  # Preserves original value
        assert len(workout["scheduled_exercises"]) > 0  # Still generates exercises

    def test_extreme_duration_values(self):
        """Test handling of extreme duration values"""
        # Very short duration
        short_context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 5
            }
        }

        # Very long duration
        long_context = {
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "daily_focus": {
                "day_date": "2025-06-29",
                "focus_sport_type_for_the_day": "STRENGTH",
                "target_total_duration_minutes": 180
            }
        }

        short_workout = create_mock_workout(short_context)
        long_workout = create_mock_workout(long_context)

        assert short_workout["target_total_duration_minutes"] == 5
        assert long_workout["target_total_duration_minutes"] == 180
        
        # Both should still generate valid exercises
        assert len(short_workout["scheduled_exercises"]) > 0
        assert len(long_workout["scheduled_exercises"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 