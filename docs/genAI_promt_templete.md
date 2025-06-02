# GenAI Prompt Template: Create a Personalized Daily Workout

## 1. User Context (Provide these details in the prompt)

### User Profile

- **`age`**: (Calculated from `date_of_birth`)
- **`gender`**: (Value from `Gender` enum)
- **`height_cm`**: (integer)
- **`weight_kg`**: (float)

### User Preferences

- **`experience_level`**: (Value from `ExperienceLevel` enum)
- **`fitness_goals`**: (Array of values from `FitnessGoal` enum)
- **`preferred_sport_types`**: (Array of values from `SportType` enum)
- **`available_equipment`**: (Array of values from `EquipmentItem` enum)
- **`workout_duration_range`**: (String, e.g., "30-45 minutes", "60 minutes")
- **`intensity_preference`**: (Value from `IntensityPreference` enum)
- **`health_notes`**: (String, e.g., "Previous knee injury, avoid high-impact jumping")
- **`disliked_exercises`**: (Array of strings, e.g., ["Burpees", "Lunges"])

### Daily Focus

- **`day_date`**: (YYYY-MM-DD for the workout)
- **`focus_sport_type_for_the_day`**: (A single value from `SportType` enum, e.g., "STRENGTH". This could be chosen by the system or user for the specific day, from their `preferred_sport_types`)
- **`target_total_duration_minutes`**: (Integer, derived from `workout_duration_range`)

## 2. Requested Output Structure (JSON)

Generate a JSON object matching the following structure. Ensure all enum values used in the output strictly match the predefined enum values.

```json
{
  "daily_workout": {
    "day_date": "YYYY-MM-DD", // Match input day_date
    "focus_sport_type_for_the_day": "STRENGTH", // Match input focus
    "scheduled_exercises": [
      {
        "sequence_order": 1,
        "exercise_name": "Example: Barbell Squats",
        "description": "Example: A compound exercise targeting quads, glutes, and hamstrings. Maintain proper form with chest up and back straight.",
        "applicable_sport_types": ["STRENGTH"], // Array of SportType enum values
        "muscle_groups_primary": ["Quads", "Glutes"], // Array of strings
        "muscle_groups_secondary": ["Hamstrings", "Core"], // Array of strings
        "equipment_needed": ["BARBELL_WITH_PLATES"], // Array of EquipmentItem enum values
        "difficulty": "Intermediate", // String (e.g., "Beginner", "Intermediate", "Advanced")
        "prescribed_sets_reps_duration": "3 sets of 8-12 reps",
        "voice_script_cue_text": "Prepare for Barbell Squats. Focus on depth and control.",
        "video_url": "https://example.com/video/barbell_squats" // Optional
      },
      {
        "sequence_order": 2,
        "exercise_name": "Example: Bench Press"
        // ... other exercise details ...
      }
      // ... more scheduled exercises to fit the target_total_duration_minutes
    ]
  }
}
```

## 3. Instructions for GenAI

### Personalization
Create exercises that align with the user's `experience_level`, `fitness_goals`, `preferred_sport_types`, `available_equipment`, and `intensity_preference`.

### Variety & Balance
If possible, provide a balanced workout targeting the `focus_sport_type_for_the_day`.

### Safety
- Adhere to any `health_notes` (e.g., avoid certain movements if an injury is mentioned)
- Avoid any exercises listed in `disliked_exercises`

### Equipment Usage
- Only prescribe exercises that use `available_equipment`
- If `NO_EQUIPMENT` is specified or implied, generate bodyweight exercises

### Duration
The sum of estimated times for all `scheduled_exercises` (including rest, if implied) should roughly match the `target_total_duration_minutes`. You might need to estimate exercise duration based on `prescribed_sets_reps_duration`.

### Clarity
Provide clear `exercise_name`, `description`, and `voice_script_cue_text`.

### Enum Adherence
For fields like `applicable_sport_types` and `equipment_needed`, use only the exact string values defined in the `SportType` and `EquipmentItem` enums respectively.

### Output Format
Strictly adhere to the requested JSON output structure.

### Number of Exercises
Generate an appropriate number of exercises to fill the `target_total_duration_minutes`, considering typical set/rep schemes and rest periods.

### Exercise Uniqueness
While exercises should be appropriate, they don't need to be globally unique IDs. The `exercise_name` should be descriptive.

## 4. Example Usage

### Example Input Context

#### User Profile
- **age**: 30
- **gender**: MALE
- **height_cm**: 180
- **weight_kg**: 75.5

#### User Preferences
- **experience_level**: INTERMEDIATE
- **fitness_goals**: [MUSCLE_GAIN, STRENGTH_GAIN]
- **preferred_sport_types**: [STRENGTH, HIIT]
- **available_equipment**: [BARBELL_WITH_PLATES, DUMBBELLS_PAIR_MEDIUM, PULL_UP_BAR]
- **workout_duration_range**: "60-75 minutes"
- **intensity_preference**: MODERATE_HIGH
- **health_notes**: "Slight shoulder impingement, avoid overhead presses for now."
- **disliked_exercises**: ["Overhead Press", "Deadlifts"]

#### Daily Focus
- **day_date**: "2025-06-03"
- **focus_sport_type_for_the_day**: "STRENGTH"
- **target_total_duration_minutes**: 60

### Requested Output Structure
*...refer to the JSON structure defined above*

---

> **Note**: This template ensures consistent, personalized workout generation while maintaining strict adherence to predefined enums and user constraints.
