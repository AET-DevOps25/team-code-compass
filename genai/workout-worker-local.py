import os
import json
import time
import logging
from typing import List, Optional, Any
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import Response
from pydantic import BaseModel, Field
from langchain.llms.base import LLM
from langchain_core.prompts import PromptTemplate
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Environment Configuration ---
LOCAL_MODEL_TYPE = os.getenv("LOCAL_MODEL_TYPE", "mock")  # "gpt4all", "ollama", "mock"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")
GPT4ALL_MODEL_PATH = os.getenv("GPT4ALL_MODEL_PATH", "./models/ggml-gpt4all-j-v1.3-groovy.bin")
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

# --- Import Shared Models from Cloud Worker ---
# We reuse the exact same models to ensure API compatibility
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
    markdown_content: str = ""

class GenAIResponse(BaseModel):
    daily_workout: GenAIDailyWorkout

class GenAIWeeklyResponse(BaseModel):
    workouts: List[GenAIDailyWorkout]

class PromptContext(BaseModel):
    user_profile: dict
    user_preferences: dict
    daily_focus: dict
    last_7_days_exercises: List[dict] = []
    text_prompt: str = ""

class WeeklyPromptContext(BaseModel):
    user_profile: dict
    user_preferences: dict
    text_prompt: str = ""
    last_7_days_exercises: List[dict] = []

# --- Local LLM Implementations ---
class LocalLLM(LLM):
    """Base class for local LLM implementations."""
    
    @property
    def _llm_type(self) -> str:
        return "local"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        raise NotImplementedError("Subclasses must implement _call method")

class GPT4AllLLM(LocalLLM):
    """GPT4All local model implementation using the 0.1.7 API."""
    
    def __init__(self, model_path: str):
        self.model_path = model_path
        self._model = None
        
    def _load_model(self):
        """Lazy load GPT4All model."""
        if self._model is None:
            try:
                from pygpt4all.models.gpt4all import GPT4All
                logger.info(f"Loading GPT4All model from {self.model_path}")
                self._model = GPT4All(self.model_path)
                logger.info("GPT4All model loaded successfully")
            except ImportError:
                raise ImportError("gpt4all package is required for GPT4All support. Install with: pip install gpt4all")
            except Exception as e:
                logger.error(f"Failed to load GPT4All model: {e}")
                raise
                
    @property
    def _llm_type(self) -> str:
        return "gpt4all"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            self._load_model()
            # Use the older API which returns a generator
            response_parts = []
            for token in self._model.generate(prompt, n_predict=2048, temp=0.7):
                response_parts.append(token)
                # Stop if we hit any stop words
                if stop:
                    current_text = ''.join(response_parts)
                    for stop_word in stop:
                        if stop_word in current_text:
                            # Truncate at the stop word
                            response_parts = current_text.split(stop_word)[0]
                            return response_parts
            
            return ''.join(response_parts).strip()
        except Exception as e:
            logger.error(f"GPT4All generation failed: {e}")
            raise Exception(f"Local model generation failed: {str(e)}")

class OllamaLLM(LocalLLM):
    """Ollama local model implementation."""
    
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url
        self.model = model
        
    @property
    def _llm_type(self) -> str:
        return "ollama"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            import requests
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=300
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get("response", "").strip()
            
        except ImportError:
            raise ImportError("requests package is required for Ollama support")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise Exception(f"Local model generation failed: {str(e)}")

class MockLocalLLM(LocalLLM):
    """Mock implementation for testing when local models are unavailable."""
    
    @property
    def _llm_type(self) -> str:
        return "mock"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        # Parse the context to extract sport type for realistic mock responses
        try:
            # Extract sport type from prompt context
            sport_type = "STRENGTH"
            if "HIIT" in prompt.upper():
                sport_type = "HIIT"
            elif "YOGA" in prompt.upper():
                sport_type = "YOGA_MOBILITY"
            elif "RUNNING" in prompt.upper():
                sport_type = "RUNNING_INTERVALS"
            elif "REST" in prompt.upper():
                sport_type = "REST"
                
            # Extract date from prompt
            date = "2025-01-20"
            if '"day_date":' in prompt:
                import re
                date_match = re.search(r'"day_date":\s*"([^"]*)"', prompt)
                if date_match:
                    date = date_match.group(1)
            
            # Generate appropriate mock response based on sport type
            if sport_type == "REST":
                return json.dumps({
                    "daily_workout": {
                        "day_date": date,
                        "focus_sport_type_for_the_day": "REST",
                        "scheduled_exercises": [],
                        "markdown_content": f"# REST - Recovery Day\nDate: {date}\n\n## Rest Day Overview\n- **Duration**: Full day recovery\n- **Focus**: Recovery and regeneration\n\n## Recommendations\n- Light walking or gentle stretching\n- Focus on hydration and nutrition\n- Get adequate sleep for recovery"
                    }
                })
            
            # Generate exercises based on sport type
            exercises = self._generate_mock_exercises(sport_type)
            
            return json.dumps({
                "daily_workout": {
                    "day_date": date,
                    "focus_sport_type_for_the_day": sport_type,
                    "scheduled_exercises": exercises,
                    "markdown_content": self._generate_mock_markdown(sport_type, exercises, date)
                }
            })
        except Exception as e:
            logger.error(f"Mock response generation failed: {e}")
            # Fallback to basic response
            return json.dumps({
                "daily_workout": {
                    "day_date": "2025-01-20",
                    "focus_sport_type_for_the_day": "STRENGTH",
                    "scheduled_exercises": [
                        {
                            "sequence_order": 1,
                            "exercise_name": "Push-ups",
                            "description": "Classic bodyweight chest exercise",
                            "applicable_sport_types": ["STRENGTH"],
                            "muscle_groups_primary": ["Chest"],
                            "muscle_groups_secondary": ["Triceps", "Shoulders"],
                            "equipment_needed": ["NO_EQUIPMENT"],
                            "difficulty": "Beginner",
                            "prescribed_sets_reps_duration": "3 sets of 10 reps",
                            "voice_script_cue_text": "Keep your body in a straight line",
                            "video_url": None
                        }
                    ],
                    "markdown_content": "# STRENGTH Workout\n\nBasic strength training session."
                }
            })
    
    def _generate_mock_exercises(self, sport_type: str) -> List[dict]:
        """Generate realistic mock exercises based on sport type."""
        exercise_templates = {
            "STRENGTH": [
                {
                    "exercise_name": "Push-ups",
                    "description": "Classic bodyweight chest exercise",
                    "muscle_groups_primary": ["Chest"],
                    "muscle_groups_secondary": ["Triceps", "Shoulders"],
                    "equipment_needed": ["NO_EQUIPMENT"],
                    "prescribed_sets_reps_duration": "3 sets of 12 reps"
                },
                {
                    "exercise_name": "Bodyweight Squats",
                    "description": "Lower body strengthening exercise",
                    "muscle_groups_primary": ["Quadriceps", "Glutes"],
                    "muscle_groups_secondary": ["Hamstrings", "Calves"],
                    "equipment_needed": ["NO_EQUIPMENT"],
                    "prescribed_sets_reps_duration": "3 sets of 15 reps"
                },
                {
                    "exercise_name": "Plank",
                    "description": "Isometric core strengthening exercise",
                    "muscle_groups_primary": ["Core"],
                    "muscle_groups_secondary": ["Shoulders", "Glutes"],
                    "equipment_needed": ["NO_EQUIPMENT"],
                    "prescribed_sets_reps_duration": "3 sets of 30 seconds"
                }
            ],
            "HIIT": [
                {
                    "exercise_name": "Burpees",
                    "description": "Full body high-intensity exercise",
                    "muscle_groups_primary": ["Full Body"],
                    "muscle_groups_secondary": ["Core"],
                    "equipment_needed": ["NO_EQUIPMENT"],
                    "prescribed_sets_reps_duration": "4 rounds of 30 seconds on, 30 seconds rest"
                },
                {
                    "exercise_name": "Mountain Climbers",
                    "description": "High-intensity cardio core exercise",
                    "muscle_groups_primary": ["Core", "Shoulders"],
                    "muscle_groups_secondary": ["Legs"],
                    "equipment_needed": ["NO_EQUIPMENT"],
                    "prescribed_sets_reps_duration": "4 rounds of 45 seconds on, 15 seconds rest"
                },
                {
                    "exercise_name": "Jump Squats",
                    "description": "Explosive lower body plyometric exercise",
                    "muscle_groups_primary": ["Quadriceps", "Glutes"],
                    "muscle_groups_secondary": ["Calves"],
                    "equipment_needed": ["NO_EQUIPMENT"],
                    "prescribed_sets_reps_duration": "4 rounds of 20 reps"
                }
            ],
            "YOGA_MOBILITY": [
                {
                    "exercise_name": "Downward Facing Dog",
                    "description": "Classic yoga pose for full body stretch",
                    "muscle_groups_primary": ["Hamstrings", "Shoulders"],
                    "muscle_groups_secondary": ["Calves", "Core"],
                    "equipment_needed": ["YOGA_MAT"],
                    "prescribed_sets_reps_duration": "Hold for 60 seconds, repeat 3 times"
                },
                {
                    "exercise_name": "Child's Pose",
                    "description": "Restorative yoga pose for relaxation",
                    "muscle_groups_primary": ["Back"],
                    "muscle_groups_secondary": ["Hips"],
                    "equipment_needed": ["YOGA_MAT"],
                    "prescribed_sets_reps_duration": "Hold for 90 seconds"
                },
                {
                    "exercise_name": "Cat-Cow Stretch",
                    "description": "Spinal mobility and core activation",
                    "muscle_groups_primary": ["Spine", "Core"],
                    "muscle_groups_secondary": ["Shoulders"],
                    "equipment_needed": ["YOGA_MAT"],
                    "prescribed_sets_reps_duration": "10 slow repetitions"
                }
            ]
        }
        
        templates = exercise_templates.get(sport_type, exercise_templates["STRENGTH"])
        exercises = []
        
        for i, template in enumerate(templates[:4], 1):  # Max 4 exercises
            exercise = {
                "sequence_order": i,
                "exercise_name": template["exercise_name"],
                "description": template["description"],
                "applicable_sport_types": [sport_type],
                "muscle_groups_primary": template["muscle_groups_primary"],
                "muscle_groups_secondary": template["muscle_groups_secondary"],
                "equipment_needed": template["equipment_needed"],
                "difficulty": "Intermediate",
                "prescribed_sets_reps_duration": template["prescribed_sets_reps_duration"],
                "voice_script_cue_text": f"Focus on proper form for {template['exercise_name']}",
                "video_url": None
            }
            exercises.append(exercise)
            
        return exercises
    
    def _generate_mock_markdown(self, sport_type: str, exercises: List[dict], date: str) -> str:
        """Generate mock markdown content."""
        content = f"# {sport_type} - Local AI Workout\nDate: {date}\n\n"
        content += "## Workout Overview\n"
        content += f"- **Duration**: 30-45 minutes\n"
        content += f"- **Focus**: {sport_type.replace('_', ' ').title()} Training\n"
        content += f"- **Generated by**: Local AI Model\n\n"
        
        content += "## Warm-up (10 minutes)\n"
        content += "- Dynamic stretching\n- Light cardio movements\n\n"
        
        content += "## Main Workout\n\n"
        for exercise in exercises:
            content += f"### {exercise['sequence_order']}. {exercise['exercise_name']}\n"
            content += f"- **Sets/Reps**: {exercise['prescribed_sets_reps_duration']}\n"
            content += f"- **Target Muscles**: {', '.join(exercise['muscle_groups_primary'])}\n"
            content += f"- **Equipment**: {', '.join(exercise['equipment_needed'])}\n"
            content += f"- **Coaching Tip**: {exercise['voice_script_cue_text']}\n\n"
        
        content += "## Cool Down (10 minutes)\n"
        content += "- Static stretching\n- Deep breathing exercises\n\n"
        content += "## Coach's Notes\n"
        content += "This workout was generated by your local AI assistant. Focus on proper form and listen to your body."
        
        return content

# --- Model Selection and Initialization ---
def create_local_llm() -> LocalLLM:
    """Create appropriate local LLM based on configuration."""
    if MOCK_MODE or LOCAL_MODEL_TYPE == "mock":
        logger.info("Using Mock Local LLM (no real AI model)")
        return MockLocalLLM()
    
    elif LOCAL_MODEL_TYPE == "gpt4all":
        try:
            logger.info(f"Initializing GPT4All model: {GPT4ALL_MODEL_PATH}")
            return GPT4AllLLM(GPT4ALL_MODEL_PATH)
        except Exception as e:
            logger.warning(f"GPT4All initialization failed: {e}. Falling back to Mock mode.")
            return MockLocalLLM()
    
    elif LOCAL_MODEL_TYPE == "ollama":
        try:
            logger.info(f"Initializing Ollama model: {OLLAMA_MODEL} at {OLLAMA_BASE_URL}")
            return OllamaLLM(OLLAMA_BASE_URL, OLLAMA_MODEL)
        except Exception as e:
            logger.warning(f"Ollama initialization failed: {e}. Falling back to Mock mode.")
            return MockLocalLLM()
    
    else:
        logger.warning(f"Unknown LOCAL_MODEL_TYPE: {LOCAL_MODEL_TYPE}. Using Mock mode.")
        return MockLocalLLM()

# --- Prometheus Metrics ---
REQUEST_COUNT = Counter(
    'genai_local_requests_total', 
    'Total number of requests to Local GenAI service',
    ['method', 'endpoint', 'status']
)
REQUEST_DURATION = Histogram(
    'genai_local_request_duration_seconds',
    'Duration of Local GenAI requests in seconds',
    ['method', 'endpoint']
)

# --- FastAPI Application ---
app = FastAPI(
    title="FlexFit Local GenAI Workout Worker",
    description="A service to generate personalized workout plans using local AI models (GPT4All, Ollama).",
    version="1.0.0"
)

# Initialize local LLM
llm = create_local_llm()

# Prometheus metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Health check endpoint - SAME AS CLOUD WORKER
@app.get("/health")
async def health_check():
    """Health check endpoint - compatible with cloud worker"""
    return {
        "status": "healthy",
        "service": "local-genai-worker",
        "model_type": LOCAL_MODEL_TYPE,
        "mock_mode": MOCK_MODE,
        "llm_type": llm._llm_type
    }

# --- Prompt Templates (Same as Cloud Worker) ---
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
- ALWAYS use proper newlines (
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
    "markdown_content": "# HIIT Workout - Generated by Local AI\\n\\nDetailed workout content here..."
  }}
}}
"""

prompt = PromptTemplate(
    template=prompt_template_str,
    input_variables=["context"],
)

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
      "markdown_content": "# Day X Workout - Generated by Local AI\\n\\nExercises and instructions."
    }}
  ]
}}
"""

weekly_prompt = PromptTemplate(
    template=weekly_prompt_template_str,
    input_variables=["context"],
)

# --- API Endpoints (IDENTICAL to Cloud Worker) ---
@app.post("/generate", response_model=GenAIResponse, summary="Generate a Workout Plan using Local AI")
async def generate_workout(context: PromptContext, authorization: Optional[str] = Header(None)):
    """Generate a single workout plan using local AI models."""
    start_time = time.time()
    
    # Authorization is optional for local worker in development
    if not authorization:
        logger.warning("No authorization header provided - continuing in development mode")
    
    try:
        logger.info(f"Generating workout with local AI model: {llm._llm_type}")
        
        # Convert context to string
        context_str = json.dumps(context.dict(), indent=2)
        
        # Build the prompt
        formatted_prompt = prompt.format(context=context_str)
        
        # Generate response using local LLM
        response_text = llm._call(formatted_prompt)
        
        # Parse JSON response
        try:
            response_data = json.loads(response_text)
            response = GenAIResponse(**response_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Raw response: {response_text[:500]}...")
            raise HTTPException(status_code=500, detail="Local AI generated invalid JSON response")
        except Exception as e:
            logger.error(f"Failed to validate response structure: {e}")
            raise HTTPException(status_code=500, detail=f"Local AI response validation failed: {str(e)}")
        
        duration = time.time() - start_time
        logger.info(f"Local workout generation completed in {duration:.2f} seconds")
        
        REQUEST_COUNT.labels(method="POST", endpoint="/generate", status="success").inc()
        REQUEST_DURATION.labels(method="POST", endpoint="/generate").observe(duration)
        
        return response
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/generate", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/generate", status="error").inc()
        logger.error(f"Unexpected error during local workout generation: {e}")
        raise HTTPException(status_code=500, detail=f"Local AI workout generation failed: {str(e)}")

@app.post("/generate-weekly", response_model=GenAIWeeklyResponse, summary="Generate a Weekly Workout Plan using Local AI")
async def generate_weekly_workout(context: WeeklyPromptContext, authorization: Optional[str] = Header(None)):
    """Generate a weekly workout plan using local AI models."""
    start_time = time.time()
    
    # Authorization is optional for local worker in development
    if not authorization:
        logger.warning("No authorization header provided - continuing in development mode")
    
    try:
        logger.info(f"Generating weekly workout with local AI model: {llm._llm_type}")
        
        # Get dates for the next 7 days starting from today
        from datetime import datetime, timedelta
        today = datetime.now().date()
        dates = [(today + timedelta(days=i)).isoformat() for i in range(7)]
        
        # Add dates to context
        context_dict = context.dict()
        context_dict['start_date'] = dates[0]
        context_dict['dates'] = dates
        
        context_str = json.dumps(context_dict, indent=2)
        
        # Build the prompt
        formatted_prompt = weekly_prompt.format(context=context_str)
        
        # Generate response using local LLM
        response_text = llm._call(formatted_prompt)
        
        # Parse JSON response
        try:
            response_data = json.loads(response_text)
            response = GenAIWeeklyResponse(**response_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse weekly LLM response as JSON: {e}")
            logger.error(f"Raw response: {response_text[:500]}...")
            raise HTTPException(status_code=500, detail="Local AI generated invalid JSON response for weekly plan")
        except Exception as e:
            logger.error(f"Failed to validate weekly response structure: {e}")
            raise HTTPException(status_code=500, detail=f"Local AI weekly response validation failed: {str(e)}")
        
        duration = time.time() - start_time
        logger.info(f"Local weekly workout generation completed in {duration:.2f} seconds")
        
        REQUEST_COUNT.labels(method="POST", endpoint="/generate-weekly", status="success").inc()
        REQUEST_DURATION.labels(method="POST", endpoint="/generate-weekly").observe(duration)
        
        return response
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/generate-weekly", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/generate-weekly", status="error").inc()
        logger.error(f"Unexpected error during local weekly workout generation: {e}")
        raise HTTPException(status_code=500, detail=f"Local AI weekly workout generation failed: {str(e)}")

# --- Startup Event ---
@app.on_event("startup")
async def startup_event():
    """Log startup information."""
    logger.info("=== FlexFit Local GenAI Worker Starting ===")
    logger.info(f"Model Type: {LOCAL_MODEL_TYPE}")
    logger.info(f"Mock Mode: {MOCK_MODE}")
    logger.info(f"LLM Type: {llm._llm_type}")
    
    if LOCAL_MODEL_TYPE == "ollama":
        logger.info(f"Ollama URL: {OLLAMA_BASE_URL}")
        logger.info(f"Ollama Model: {OLLAMA_MODEL}")
    elif LOCAL_MODEL_TYPE == "gpt4all":
        logger.info(f"GPT4All Model Path: {GPT4ALL_MODEL_PATH}")
    
    logger.info("=== Local GenAI Worker Ready ===")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8084)