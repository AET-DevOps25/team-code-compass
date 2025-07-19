# FlexFit 7-Day Workout Generator Prompt

## Implementation Guide for Claude Code

### Changes to Make:

1. **Workout Planner Service (Spring Boot)**:
   - Keep the same endpoint parameters as single-day
   - Add logic to fetch last 7 days from database:
     ```java
     List<DailyWorkout> last7Days = workoutRepository
       .findByUserIdAndDateBetweenOrderByDate(
         userId, 
         LocalDate.now().minusDays(7), 
         LocalDate.now()
       );
     ```
   - Pass last 7 days to GenAI worker along with existing parameters

2. **GenAI Worker (Python)**:
   - Modify the prompt template to generate 7 days instead of 1
   - Update the response model to return array of workouts
   - Shorten individual exercise prompts since generating 7x content

3. **Database Saving**:
   - Save all 7 workouts in a single transaction
   - Update the response to return all 7 saved workouts

### Specific Code Changes:

**In Workout Planner Service:**
```java
// Add to existing endpoint
@PostMapping("/generate-weekly-plan")
public ResponseEntity<List<DailyWorkout>> generateWeeklyPlan(
    @RequestBody WorkoutPlanRequest request) {
    
    // Fetch last 7 days
    List<DailyWorkout> last7Days = getLastSevenDaysWorkouts(request.getUserId());
    
    // Add to context for GenAI
    request.setLast7DaysExercises(last7Days);
    
    // Call GenAI worker (returns 7 workouts)
    List<GenAIDailyWorkout> weeklyPlan = genAIWorker.generateWeeklyPlan(request);
    
    // Save all 7 workouts
    return saveWeeklyPlan(weeklyPlan);
}
```

**In GenAI Worker (worker.py):**
```python
# Update response model
class GenAIWeeklyResponse(BaseModel):
    workouts: List[GenAIDailyWorkout]

# Update endpoint
@app.post("/generate-weekly", response_model=GenAIWeeklyResponse)
async def generate_weekly_workout(context: PromptContext):
    # Same logic but returns 7 workouts
```

## Overview
You are an expert fitness coach creating a complete 7-day workout plan. Generate all 7 days at once with proper progression and recovery.

## Input Format
You will receive:
```json
{
  "user_profile": {
    "user_id": "UUID",
    "date_of_birth": "YYYY-MM-DD",
    "height_cm": 180,
    "weight_kg": 75,
    "gender": "MALE"
  },
  "user_preferences": {
    "experience_level": "INTERMEDIATE",
    "fitness_goals": ["MUSCLE_GAIN", "STRENGTH_GAIN"],
    "preferred_sport_types": ["STRENGTH", "HIIT"],
    "available_equipment": ["DUMBBELLS_PAIR_MEDIUM", "BARBELL_WITH_PLATES", "BENCH_FLAT"],
    "workout_duration_range": "45-60 minutes",
    "intensity_preference": "MODERATE_HIGH",
    "health_notes": "Lower back sensitivity",
    "disliked_exercises": ["upright_rows", "behind_neck_press"]
  },
  "text_prompt": "Focus on upper/lower split with compound movements",
  "last_7_days_exercises": [
    {
      "day_date": "2025-01-06",
      "sport_type": "STRENGTH",
      "exercises": ["Bench Press", "Rows", "Shoulder Press"],
      "muscle_groups_worked": ["chest", "back", "shoulders"]
    }
    // ... more days
  ]
}
```

## Output Format - STRICT JSON STRUCTURE
Return an array of 7 daily workouts following this EXACT format:

```json
{
  "workouts": [
    {
      "daily_workout": {
        "day_date": "2025-01-13",
        "focus_sport_type_for_the_day": "STRENGTH",
        "scheduled_exercises": [
          {
            "sequence_order": 1,
            "exercise_name": "Barbell Back Squat",
            "description": "Compound lower body exercise targeting quads and glutes",
            "applicable_sport_types": ["STRENGTH"],
            "muscle_groups_primary": ["Quadriceps", "Glutes"],
            "muscle_groups_secondary": ["Hamstrings", "Core"],
            "equipment_needed": ["BARBELL_WITH_PLATES", "SQUAT_RACK"],
            "difficulty": "Intermediate",
            "prescribed_sets_reps_duration": "4 sets of 8 reps",
            "voice_script_cue_text": "Keep chest up, core tight, drive through heels",
            "video_url": null
          }
        ],
        "markdown_content": "# Lower Body Power - Day 1\\n\\n## Warm-up\\n..."
      }
    }
    // ... 6 more days
  ]
}
```

## CRITICAL REQUIREMENTS

### Valid Enum Values Only
**Sport Types**: STRENGTH, HIIT, YOGA_MOBILITY, RUNNING_INTERVALS

**Equipment**: NO_EQUIPMENT, DUMBBELLS_PAIR_LIGHT, DUMBBELLS_PAIR_MEDIUM, DUMBBELLS_PAIR_HEAVY, BARBELL_WITH_PLATES, KETTLEBELL, RESISTANCE_BANDS, PULL_UP_BAR, YOGA_MAT, STABILITY_BALL, JUMP_ROPE, MEDICINE_BALL, FOAM_ROLLER, BENCH, CABLE_MACHINE, SQUAT_RACK, TREADMILL, STATIONARY_BIKE, ROWING_MACHINE

**Experience Levels**: TRUE_BEGINNER, BEGINNER, INTERMEDIATE, ADVANCED, REHAB_POSTPARTUM

**Difficulty**: Beginner, Intermediate, Advanced

### 7-Day Generation Rules

1. **Recovery Pattern**: Never work same muscle groups on consecutive days
2. **Sport Type Rotation**: Vary sport types throughout the week based on preferences
3. **Progressive Loading**: 
   - Week should start moderate and build intensity
   - Include at least 1-2 rest or light days
4. **Equipment Usage**: Only use equipment from available_equipment list
5. **Duration Compliance**: Each workout should fit within workout_duration_range
6. **Exercise Count**: 4-8 exercises per workout depending on sport type

### Muscle Group Rotation Example
- Day 1: Upper Push (chest, shoulders, triceps)
- Day 2: Lower (quads, glutes, calves)
- Day 3: Yoga/Mobility or Rest
- Day 4: Upper Pull (back, biceps)
- Day 5: Lower (hamstrings, glutes)
- Day 6: HIIT Full Body
- Day 7: Rest or Light Cardio

### Markdown Content Structure
Each workout must include rich markdown with:
```markdown
# [Sport Type] Workout - [Date]

## Workout Overview
- Duration: X minutes
- Equipment: [List equipment needed]
- Focus: [Primary muscle groups]

## Warm-up (5-10 minutes)
- Dynamic movements specific to workout

## Main Workout
| Exercise | Sets | Reps/Duration | Rest |
|----------|------|---------------|------|
| Exercise 1 | 3 | 12 | 90s |

## Cool Down (5-10 minutes)
- Static stretches for worked muscles

## Coach's Notes
- Form tips and motivation
```

## Example 7-Day Output Structure
Day 1 (2025-01-13): STRENGTH - Upper Push
Day 2 (2025-01-14): STRENGTH - Lower Power  
Day 3 (2025-01-15): YOGA_MOBILITY - Recovery
Day 4 (2025-01-16): STRENGTH - Upper Pull
Day 5 (2025-01-17): STRENGTH - Lower Volume
Day 6 (2025-01-18): HIIT - Full Body
Day 7 (2025-01-19): Rest or RUNNING_INTERVALS - Light

Remember: Each day's workout must be unique, properly structured, and use only valid enum values!

## Summary for Implementation

### What Changes:
1. **Endpoint Parameters**: SAME as single-day (no changes needed)
2. **Database Query**: ADD fetching last 7 days before calling GenAI
3. **GenAI Call**: SEND last 7 days along with existing parameters
4. **GenAI Response**: RETURNS 7 workouts instead of 1
5. **Database Save**: SAVE all 7 workouts in one transaction

### What Stays the Same:
- User preferences structure
- Request parameters
- Individual exercise structure
- Validation logic

The main change is extending from 1 day to 7 days while keeping the same architecture!