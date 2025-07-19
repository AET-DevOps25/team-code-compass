import os
import requests
import json
import time
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from langchain.llms.base import LLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.callbacks.manager import CallbackManagerForLLMRun
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# --- Environment and API Configuration ---
# Open WebUI API Configuration
OPEN_WEBUI_BASE_URL = os.getenv("OPEN_WEBUI_BASE_URL", "https://gpu.aet.cit.tum.de")
CHAIR_API_KEY = os.getenv("CHAIR_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")

# Construct API URL for Open WebUI
API_URL = f"{OPEN_WEBUI_BASE_URL}/api/chat/completions"

# Mock mode flag
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# --- Pydantic Models for API and LLM Output ---
class GenAIExercise(BaseModel):
    sequence_order: int
    exercise_name: str
    description: str
    applicable_sport_types: List[str]
    muscle_groups_primary: List[str]
    muscle_groups_secondary: List[str]
    equipment_needed: List[str]
    difficulty: str
    prescribed_sets_reps_duration: str
    voice_script_cue_text: str
    video_url: Optional[str] = None

class GenAIDailyWorkout(BaseModel):
    day_date: str
    focus_sport_type_for_the_day: str
    scheduled_exercises: List[GenAIExercise]
    markdown_content: str = ""  # Rich markdown content for frontend display

class GenAIResponse(BaseModel):
    daily_workout: GenAIDailyWorkout

class GenAIWeeklyResponse(BaseModel):
    workouts: List[GenAIDailyWorkout]

class PromptContext(BaseModel):
    user_profile: Any
    user_preferences: Any
    daily_focus: Any

class WeeklyPromptContext(BaseModel):
    user_profile: Any
    user_preferences: Any
    text_prompt: str
    last_7_days_exercises: List[Any]

# --- Custom LangChain LLM for Open WebUI ---
class OpenWebUILLM(LLM):
    """Custom LangChain LLM wrapper for Open WebUI API."""
    
    @property
    def _llm_type(self) -> str:
        return "open_webui"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        if not CHAIR_API_KEY:
            raise ValueError("CHAIR_API_KEY environment variable is required for Open WebUI API access")
        
        # Open WebUI uses OpenAI-compatible API format
        headers = {
            "Authorization": f"Bearer {CHAIR_API_KEY}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": MODEL_NAME,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        }
        
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=300)
            response.raise_for_status()
            result = response.json()
            
            # Handle OpenAI-compatible response format
            if "choices" in result and result["choices"]:
                content = result["choices"][0].get("message", {}).get("content", "")
                return content.strip()
            else:
                raise ValueError("Unexpected response format from Open WebUI API")
        except requests.RequestException as e:
            print(f"Open WebUI API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response text: {e.response.text}")
            raise Exception(f"Failed to connect to Open WebUI service at {API_URL}. Please check API configuration and CHAIR_API_KEY.")
        except (KeyError, IndexError, ValueError) as e:
            print(f"Failed to parse Open WebUI response: {e}")
            raise Exception(f"Failed to parse Open WebUI response. Check model output format.")

# --- Prometheus Metrics Setup ---
REQUEST_COUNT = Counter(
    'genai_requests_total', 
    'Total number of requests to GenAI service',
    ['method', 'endpoint', 'status']
)
REQUEST_DURATION = Histogram(
    'genai_request_duration_seconds',
    'Duration of GenAI requests in seconds',
    ['method', 'endpoint']
)
GENERATION_COUNT = Counter(
    'genai_workout_generations_total',
    'Total number of workout generations',
    ['generation_type', 'status']
)
GENERATION_DURATION = Histogram(
    'genai_generation_duration_seconds',
    'Duration of workout generation in seconds',
    ['generation_type']
)

# --- FastAPI Application Setup ---
app = FastAPI(
    title="FlexFit GenAI Workout Worker",
    description="A service to generate personalized workout plans using Open WebUI.",
    version="1.0.0"
)

# Prometheus metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.on_event("startup")
async def startup_event():
    """Initialize FlexFit GenAI Workout Worker"""
    print("Initializing FlexFit GenAI Workout Worker...")
    if MOCK_MODE:
        print("Mock mode enabled - using pre-defined responses")
    else:
        print("Real API mode enabled - using Open WebUI")

# --- LangChain Setup ---
llm = OpenWebUILLM()
parser = JsonOutputParser(pydantic_object=GenAIResponse)
weekly_parser = JsonOutputParser(pydantic_object=GenAIWeeklyResponse)

weekly_prompt_template_str = """
Create a 7-day workout plan. User context: {context}

WORKOUT HISTORY ANALYSIS:
- Review last_7_days_exercises to avoid repeating recent exercises
- Consider muscle groups trained recently for balanced weekly programming
- Ensure adequate recovery between similar exercise patterns
- Vary training intensities based on recent workout completion rates

Rules:
- Generate 7 consecutive days of workouts
- Vary sport types: STRENGTH, HIIT, YOGA_MOBILITY, RUNNING_INTERVALS, REST
- Use valid equipment: NO_EQUIPMENT, DUMBBELLS_PAIR_MEDIUM, BARBELL_WITH_PLATES, BENCH_FLAT, YOGA_MAT
- Include 1-2 REST days for recovery (more if recent workouts show high intensity)
- 3-5 exercises per workout (0 exercises for REST days)
- Difficulty: Beginner, Intermediate, Advanced
- AVOID exercises from last_7_days_exercises unless necessary for progression

JSON format:
{{
  "workouts": [
    {{
      "day_date": "YYYY-MM-DD",
      "focus_sport_type_for_the_day": "SPORT_TYPE",
      "scheduled_exercises": [
        {{
          "sequence_order": 1,
          "exercise_name": "Exercise Name",
          "description": "Brief description",
          "applicable_sport_types": ["SPORT_TYPE"],
          "muscle_groups_primary": ["Primary"],
          "muscle_groups_secondary": ["Secondary"],
          "equipment_needed": ["EQUIPMENT_ENUM"],
          "difficulty": "Intermediate",
          "prescribed_sets_reps_duration": "3 sets x 12 reps",
          "voice_script_cue_text": "Form cue",
          "video_url": null
        }}
      ],
      "markdown_content": "# Day X Workout\\n\\nExercises and instructions."
    }}
  ]
}}
"""

prompt_template_str = """
You are an expert fitness coach and workout programmer. Create a personalized daily workout plan based on the provided user context.

IMPORTANT: Each workout must be UNIQUE and VARIED. Consider the specific date, user's fitness level, preferences, and create fresh content each time.

Your response MUST be a JSON object that strictly follows the format shown in the JSON Structure Example below.

User Context:
{context}

GUIDELINES:

### Personalization
Create exercises that align with the user's experience_level, fitness_goals, preferred_sport_types, available_equipment, and intensity_preference.

### Workout History Analysis
CRITICALLY IMPORTANT: Analyze the user's last_7_days_exercises to ensure variety and proper recovery:
- AVOID repeating exercises from recent workouts (last 7 days)
- Consider muscle groups trained recently - focus on different muscle groups or use different movement patterns
- If recent workouts were high intensity, consider lower intensity or recovery-focused exercises
- If the same sport type was done recently, vary the exercise selection significantly
- For REST days, create light recovery activities (gentle stretching, mobility work, breathing exercises)
- Pay attention to completion_status of recent workouts to gauge user's current fitness state

### Variety & Balance
Provide a balanced workout targeting the focus_sport_type_for_the_day. Make each workout DIFFERENT from previous days by varying:
- Exercise selection and order (especially avoiding recent exercises)
- Rep ranges (strength vs endurance)  
- Set schemes (straight sets, circuits, supersets)
- Rest periods and intensity zones
- Movement patterns and muscle group focuses
- Warm-up and cool-down approaches

### Safety
- Adhere to any health_notes (e.g., avoid certain movements if an injury is mentioned)
- Avoid any exercises listed in disliked_exercises
- Progress appropriately based on experience_level

### Equipment Usage
- Only prescribe exercises that use available_equipment
- If NO_EQUIPMENT is specified, generate bodyweight exercises only
- Valid equipment enum values: ["NO_EQUIPMENT", "DUMBBELLS_PAIR_LIGHT", "DUMBBELLS_PAIR_MEDIUM", "DUMBBELLS_PAIR_HEAVY", "ADJUSTABLE_DUMBBELLS", "KETTLEBELL", "BARBELL_WITH_PLATES", "RESISTANCE_BANDS_LIGHT", "RESISTANCE_BANDS_MEDIUM", "RESISTANCE_BANDS_HEAVY", "PULL_UP_BAR", "YOGA_MAT", "FOAM_ROLLER", "JUMP_ROPE", "BENCH_FLAT", "BENCH_ADJUSTABLE", "SQUAT_RACK", "TREADMILL", "STATIONARY_BIKE", "ELLIPTICAL", "ROWING_MACHINE", "CABLE_MACHINE_FULL", "LEG_PRESS_MACHINE", "MEDICINE_BALL", "STABILITY_BALL"]

### Duration
The sum of estimated times for all scheduled_exercises (including rest periods) should roughly match the target_total_duration_minutes.

### Sport Type Enums
Use only these exact values for applicable_sport_types:
- "STRENGTH" (weightlifting, resistance training)
- "HIIT" (high-intensity interval training, CrossFit)
- "YOGA_MOBILITY" (yoga, stretching, flexibility)
- "RUNNING_INTERVALS" (running, cardio intervals)
- "REST" (recovery day - MUST have empty scheduled_exercises array)

### Exercise Structure Requirements
Each exercise MUST include:
- sequence_order: integer (1, 2, 3, etc.)
- exercise_name: string (clear, descriptive name)
- description: string (detailed explanation with form cues)
- applicable_sport_types: array of SportType enum values
- muscle_groups_primary: array of strings (main muscles targeted)
- muscle_groups_secondary: array of strings (supporting muscles)
- equipment_needed: array of EquipmentItem enum values
- difficulty: string ("Beginner", "Intermediate", or "Advanced")
- prescribed_sets_reps_duration: string (e.g., "3 sets of 12 reps", "45 seconds")
- voice_script_cue_text: string (coaching cues for proper form)
- video_url: string or null (optional video reference)

### Markdown Content Requirements
Generate comprehensive markdown_content including:
- Workout title and overview
- Warm-up section (5-10 minutes)
- Main workout with exercise tables
- Cool-down section (5-10 minutes)
- Motivational elements and tips
- Progress tracking suggestions
- Use proper markdown formatting with headers, tables, and lists

### CRITICAL: Table Formatting Rules
When creating exercise tables in markdown_content:
- ALWAYS use proper newlines (\\n) between table rows
- Table format MUST be: header row, separator row, then data rows
- Example: "| Exercise | Sets | Reps |\\n|----------|------|------|\\n| Push-ups | 3 | 10 |\\n| Squats | 3 | 15 |"
- Each table row MUST end with \\n before the next row starts
- Do NOT put all table content on a single line

### Output Requirements
1. Create 4-8 exercises depending on duration and complexity
2. Include proper sequence_order for each exercise
3. Provide clear exercise_name, description, and voice_script_cue_text
4. Specify muscle_groups_primary and muscle_groups_secondary
5. Use exact enum values for applicable_sport_types and equipment_needed
6. Include appropriate difficulty level matching user's experience_level
7. Generate rich markdown_content with proper formatting

### Day-Specific Variation
Consider the specific day_date and create content that feels fresh and different from previous workouts while maintaining consistency with user preferences.

### REST Day Handling
CRITICAL: If focus_sport_type_for_the_day is "REST":
- Set scheduled_exercises to an empty array: []
- Create recovery-focused markdown_content with light activities
- Include recommendations for hydration, sleep, and gentle movement
- Do NOT create any structured exercises or workouts

### Custom Instructions
If a text_prompt is provided in the context, incorporate those specific instructions and preferences into the workout design. This may include:
- Specific exercise requests or modifications
- Focus areas or training goals for the day
- Recovery or rest day specifications
- Special considerations or adaptations

### JSON Structure Example
{{
  "daily_workout": {{
    "day_date": "2025-01-13",
    "focus_sport_type_for_the_day": "HIIT",
    "scheduled_exercises": [
      {{
        "sequence_order": 1,
        "exercise_name": "Burpees",
        "description": "Full body exercise combining squat, plank, and jump",
        "applicable_sport_types": ["HIIT"],
        "muscle_groups_primary": ["Full Body"],
        "muscle_groups_secondary": ["Core"],
        "equipment_needed": ["NO_EQUIPMENT"],
        "difficulty": "Intermediate",
        "prescribed_sets_reps_duration": "3 sets of 10 reps",
        "voice_script_cue_text": "Keep your core tight throughout the movement",
        "video_url": null
      }}
    ],
    "markdown_content": "# HIIT Workout\\n\\n## Warm-up\\n- Light jogging in place: 2 minutes\\n\\n## Main Workout\\n\\n| Exercise | Sets | Reps | Rest |\\n|----------|------|------|------|\\n| Burpees | 3 | 10 | 60s |\\n| Mountain Climbers | 3 | 20 | 45s |\\n\\n## Cool Down\\n- Static stretching: 5 minutes"
  }}
}}
"""
prompt = PromptTemplate(
    template=prompt_template_str,
    input_variables=["context"],
)
chain = prompt | llm | parser

weekly_prompt = PromptTemplate(
    template=weekly_prompt_template_str,
    input_variables=["context"],
)
weekly_chain = weekly_prompt | llm | weekly_parser

# --- API Endpoints ---
@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy", "api_url": API_URL, "model": MODEL_NAME}

@app.post("/generate", response_model=GenAIResponse, summary="Generate a Workout Plan")
async def generate_workout(context: PromptContext, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    # Mock mode for testing when API is unavailable
    if os.getenv("MOCK_MODE", "false").lower() == "true":
        return generate_mock_response(context)
    
    try:
        context_str = json.dumps(context.dict(), indent=2)
        response = chain.invoke({"context": context_str})
        return response
    except Exception as e:
        print(f"Error during LangChain invocation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workout plan: {str(e)}")

@app.post("/generate-weekly", response_model=GenAIWeeklyResponse, summary="Generate a Weekly Workout Plan")
async def generate_weekly_workout(context: WeeklyPromptContext, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    # Mock mode for testing when API is unavailable
    if os.getenv("MOCK_MODE", "false").lower() == "true":
        return generate_mock_weekly_response(context)
    
    try:
        # Get dates for the next 7 days starting from today
        from datetime import datetime, timedelta
        today = datetime.now().date()
        dates = [(today + timedelta(days=i)).isoformat() for i in range(7)]
        
        # Add dates to context
        context_dict = context.dict()
        context_dict['start_date'] = dates[0]
        context_dict['dates'] = dates
        
        context_str = json.dumps(context_dict, indent=2)
        response = weekly_chain.invoke({"context": context_str})
        return response
    except Exception as e:
        print(f"Error during LangChain weekly invocation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate weekly workout plan: {str(e)}")

def generate_mock_response(context: PromptContext) -> GenAIResponse:
    """Generate a mock workout response for testing purposes"""
    sport_type = context.daily_focus.get("sport_type", "STRENGTH")
    duration = context.daily_focus.get("duration_minutes", 45)
    date = context.daily_focus.get("date", "2025-01-14")
    
    mock_exercises = []
    
    if sport_type == "STRENGTH":
        mock_exercises = [
            GenAIExercise(
                sequence_order=1,
                exercise_name="Dumbbell Bench Press",
                description="Lie on a bench and press dumbbells up",
                applicable_sport_types=["STRENGTH"],
                muscle_groups_primary=["Chest"],
                muscle_groups_secondary=["Triceps", "Shoulders"],
                equipment_needed=["DUMBBELLS_PAIR_MEDIUM"],
                difficulty="Intermediate",
                prescribed_sets_reps_duration="3 sets x 12 reps",
                voice_script_cue_text="Keep your core tight and press through your chest"
            ),
            GenAIExercise(
                sequence_order=2,
                exercise_name="Bent-Over Dumbbell Row",
                description="Hinge at hips and row dumbbells to your sides",
                applicable_sport_types=["STRENGTH"],
                muscle_groups_primary=["Back"],
                muscle_groups_secondary=["Biceps"],
                equipment_needed=["DUMBBELLS_PAIR_MEDIUM"],
                difficulty="Intermediate",
                prescribed_sets_reps_duration="3 sets x 10 reps",
                voice_script_cue_text="Keep your back straight and pull with your lats"
            )
        ]
    elif sport_type == "HIIT":
        mock_exercises = [
            GenAIExercise(
                sequence_order=1,
                exercise_name="Burpees",
                description="Full body explosive movement",
                applicable_sport_types=["HIIT"],
                muscle_groups_primary=["Full Body"],
                muscle_groups_secondary=[],
                equipment_needed=["NO_EQUIPMENT"],
                difficulty="Advanced",
                prescribed_sets_reps_duration="30 seconds work, 15 seconds rest x 4 rounds",
                voice_script_cue_text="Stay explosive and keep moving"
            )
        ]
    elif sport_type == "REST":
        # REST days have no exercises
        mock_exercises = []
    
    # Handle REST day markdown content differently
    if sport_type == "REST":
        markdown_content = f"""# {sport_type} Day - {date}

## Rest Day Overview
- **Duration**: Full day recovery
- **Focus**: Recovery and regeneration
- **Sport Type**: {sport_type}

## Recommendations
- Light walking or gentle stretching (10-15 minutes)
- Focus on hydration and nutrition
- Get adequate sleep (7-9 hours) for recovery
- Practice mindfulness or meditation

## Optional Light Activities
- 10-15 minutes of gentle stretching
- Light walk or leisurely bike ride
- Breathing exercises and relaxation
- Foam rolling or self-massage

## Coach's Notes
Rest days are crucial for muscle recovery, adaptation, and preventing overtraining. Listen to your body and avoid intense physical activity.
"""
    else:
        markdown_content = f"""# {sport_type} Workout - {date}

## Workout Overview
- **Duration**: {duration} minutes
- **Equipment**: Dumbbells
- **Focus**: {sport_type}

## Exercises

"""
    
    for ex in mock_exercises:
        markdown_content += f"""### {ex.sequence_order}. {ex.exercise_name}
- **Sets/Reps**: {ex.prescribed_sets_reps_duration}
- **Primary Muscles**: {', '.join(ex.muscle_groups_primary)}
- **Coaching Cue**: {ex.voice_script_cue_text}

"""
    
    return GenAIResponse(
        daily_workout=GenAIDailyWorkout(
            day_date=date,
            focus_sport_type_for_the_day=sport_type,
            scheduled_exercises=mock_exercises,
            markdown_content=markdown_content
        )
    )

def generate_mock_weekly_response(context: WeeklyPromptContext) -> GenAIWeeklyResponse:
    """Generate a mock weekly workout response for testing purposes"""
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    workouts = []
    
    # Define a 7-day split with REST days included
    workout_plan = [
        ("STRENGTH", "Upper Push", ["Chest", "Shoulders", "Triceps"]),
        ("STRENGTH", "Lower Power", ["Quadriceps", "Glutes", "Calves"]),
        ("YOGA_MOBILITY", "Recovery Flow", ["Full Body"]),
        ("REST", "Active Rest", ["Full Body"]),
        ("STRENGTH", "Upper Pull", ["Back", "Biceps"]),
        ("HIIT", "Full Body Blast", ["Full Body"]),
        ("REST", "Complete Rest", ["Full Body"])
    ]
    
    for i, (sport_type, workout_name, muscle_groups) in enumerate(workout_plan):
        date = (today + timedelta(days=i)).isoformat()
        
        exercises = []
        if sport_type == "STRENGTH":
            if "Upper Push" in workout_name:
                exercises = [
                    GenAIExercise(
                        sequence_order=1,
                        exercise_name="Barbell Bench Press",
                        description="Primary chest builder",
                        applicable_sport_types=["STRENGTH"],
                        muscle_groups_primary=["Chest"],
                        muscle_groups_secondary=["Triceps", "Shoulders"],
                        equipment_needed=["BARBELL_WITH_PLATES", "BENCH_FLAT"],
                        difficulty="Intermediate",
                        prescribed_sets_reps_duration="4 sets x 8-10 reps",
                        voice_script_cue_text="Keep shoulder blades retracted"
                    ),
                    GenAIExercise(
                        sequence_order=2,
                        exercise_name="Dumbbell Shoulder Press",
                        description="Overhead pressing movement",
                        applicable_sport_types=["STRENGTH"],
                        muscle_groups_primary=["Shoulders"],
                        muscle_groups_secondary=["Triceps"],
                        equipment_needed=["DUMBBELLS_PAIR_MEDIUM"],
                        difficulty="Intermediate",
                        prescribed_sets_reps_duration="3 sets x 10-12 reps",
                        voice_script_cue_text="Press up and slightly back"
                    )
                ]
            elif "Upper Pull" in workout_name:
                exercises = [
                    GenAIExercise(
                        sequence_order=1,
                        exercise_name="Pull-ups",
                        description="Upper body pulling movement",
                        applicable_sport_types=["STRENGTH"],
                        muscle_groups_primary=["Back"],
                        muscle_groups_secondary=["Biceps"],
                        equipment_needed=["PULL_UP_BAR"],
                        difficulty="Intermediate",
                        prescribed_sets_reps_duration="3 sets x 8-12 reps",
                        voice_script_cue_text="Pull chest to bar"
                    )
                ]
        elif sport_type == "HIIT":
            exercises = [
                GenAIExercise(
                    sequence_order=1,
                    exercise_name="Burpees",
                    description="Full body explosive movement",
                    applicable_sport_types=["HIIT"],
                    muscle_groups_primary=["Full Body"],
                    muscle_groups_secondary=[],
                    equipment_needed=["NO_EQUIPMENT"],
                    difficulty="Advanced",
                    prescribed_sets_reps_duration="30 seconds work, 15 seconds rest x 4",
                    voice_script_cue_text="Stay explosive throughout"
                )
            ]
        elif sport_type == "YOGA_MOBILITY":
            exercises = [
                GenAIExercise(
                    sequence_order=1,
                    exercise_name="Sun Salutation Flow",
                    description="Dynamic yoga sequence",
                    applicable_sport_types=["YOGA_MOBILITY"],
                    muscle_groups_primary=["Full Body"],
                    muscle_groups_secondary=[],
                    equipment_needed=["YOGA_MAT"],
                    difficulty="Beginner",
                    prescribed_sets_reps_duration="5 rounds at your own pace",
                    voice_script_cue_text="Breathe with each movement"
                )
            ]
        # REST days have no exercises
        
        if sport_type == "REST":
            markdown_content = f"""# {sport_type} - {workout_name}
Date: {date}

## Rest Day Overview
- **Duration**: Full day recovery
- **Focus**: {', '.join(muscle_groups)}
- **Sport Type**: {sport_type}

## Recommendations
- Light walking or gentle stretching
- Focus on hydration and nutrition
- Get adequate sleep for recovery

## Optional Light Activities
- 10-15 minutes of gentle stretching
- Light walk or leisurely bike ride
- Meditation or breathing exercises

## Coach's Notes
Rest days are crucial for muscle recovery and adaptation. Listen to your body and avoid intense training.
"""
        else:
            markdown_content = f"""# {sport_type} - {workout_name}
Date: {date}

## Workout Overview
- **Duration**: 45-60 minutes
- **Focus**: {', '.join(muscle_groups)}
- **Sport Type**: {sport_type}

## Warm-up (10 minutes)
- Dynamic stretching
- Light cardio movements

## Main Workout
"""
        
            for ex in exercises:
                markdown_content += f"""
### {ex.sequence_order}. {ex.exercise_name}
- **Sets/Reps**: {ex.prescribed_sets_reps_duration}
- **Target Muscles**: {', '.join(ex.muscle_groups_primary)}
- **Equipment**: {', '.join(ex.equipment_needed)}
- **Coaching Tip**: {ex.voice_script_cue_text}

"""
        
            markdown_content += """
## Cool Down (10 minutes)
- Static stretching
- Deep breathing exercises

## Coach's Notes
Focus on form and controlled movements. Adjust weights as needed to maintain proper technique throughout all sets.
"""
        
        workout = GenAIDailyWorkout(
            day_date=date,
            focus_sport_type_for_the_day=sport_type,
            scheduled_exercises=exercises,
            markdown_content=markdown_content
        )
        workouts.append(workout)
    
    return GenAIWeeklyResponse(workouts=workouts)
