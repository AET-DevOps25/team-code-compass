import os
import requests
import json
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from langchain.llms.base import LLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.callbacks.manager import CallbackManagerForLLMRun

# --- Environment and API Configuration ---
CHAIR_API_KEY = os.getenv("CHAIR_API_KEY")
API_URL = "https://gpu.aet.cit.tum.de/api/chat/completions"
MODEL_NAME = "llama3:latest" # Or any other model available on the TUM service

if not CHAIR_API_KEY:
    raise ValueError("CHAIR_API_KEY environment variable is not set.")

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

class GenAIResponse(BaseModel):
    daily_workout: GenAIDailyWorkout

class PromptContext(BaseModel):
    user_profile: Any
    user_preferences: Any
    daily_focus: Any

# --- Custom LangChain LLM for TUM Open WebUI ---
class TumOpenWebUILLM(LLM):
    """Custom LangChain LLM wrapper for the TUM Open WebUI API."""
    
    @property
    def _llm_type(self) -> str:
        return "tum_open_webui"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
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
            response = requests.post(API_URL, headers=headers, json=payload, timeout=90)
            response.raise_for_status()
            result = response.json()
            
            if "choices" in result and result["choices"]:
                content = result["choices"][0].get("message", {}).get("content", "")
                return content.strip()
            else:
                raise ValueError("Unexpected response format from API")
        except requests.RequestException as e:
            raise Exception(f"API request to TUM Open WebUI failed: {e}")
        except (KeyError, IndexError, ValueError) as e:
            raise Exception(f"Failed to parse API response: {e}")

# --- FastAPI Application Setup ---
app = FastAPI(
    title="FlexFit GenAI Workout Worker",
    description="A service to generate personalized workout plans using the TUM Open WebUI.",
    version="1.0.0"
)

# --- LangChain Setup ---
llm = TumOpenWebUILLM()
parser = JsonOutputParser(pydantic_object=GenAIResponse)
prompt_template_str = """
You are an expert fitness coach. Create a personalized daily workout plan based on the provided user context.
Your response MUST be a JSON object that strictly follows this format: {format_instructions}

User Context:
{context}
"""
prompt = PromptTemplate(
    template=prompt_template_str,
    input_variables=["context"],
    partial_variables={"format_instructions": parser.get_format_instructions()},
)
chain = prompt | llm | parser

# --- API Endpoints ---
@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy"}

@app.post("/generate", response_model=GenAIResponse, summary="Generate a Workout Plan")
async def generate_workout(context: PromptContext, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    # TEMPORARY: Return mock data for testing instead of calling external API
    try:
        # Extract sport type from context for personalization
        sport_type = context.daily_focus.get("focus_sport_type_for_the_day", "STRENGTH")
        day_date = context.daily_focus.get("day_date", "2025-06-29")
        
        # Create mock workout plan based on sport type
        mock_exercises = []
        if sport_type == "STRENGTH":
            mock_exercises = [
                GenAIExercise(
                    sequence_order=1,
                    exercise_name="Push-ups",
                    description="Classic bodyweight exercise targeting chest, shoulders, and triceps",
                    applicable_sport_types=["STRENGTH"],
                    muscle_groups_primary=["chest", "triceps"],
                    muscle_groups_secondary=["shoulders", "core"],
                    equipment_needed=["NO_EQUIPMENT"],
                    difficulty="Beginner",
                    prescribed_sets_reps_duration="3 sets of 10-15 reps",
                    voice_script_cue_text="Start in plank position, lower chest to ground, push back up",
                    video_url="https://example.com/pushups"
                ),
                GenAIExercise(
                    sequence_order=2,
                    exercise_name="Squats",
                    description="Fundamental lower body exercise targeting quads, glutes, and hamstrings",
                    applicable_sport_types=["STRENGTH"],
                    muscle_groups_primary=["quadriceps", "glutes"],
                    muscle_groups_secondary=["hamstrings", "calves"],
                    equipment_needed=["NO_EQUIPMENT"],
                    difficulty="Beginner",
                    prescribed_sets_reps_duration="3 sets of 12-20 reps",
                    voice_script_cue_text="Feet shoulder-width apart, lower hips back and down, drive through heels to stand",
                    video_url="https://example.com/squats"
                ),
                GenAIExercise(
                    sequence_order=3,
                    exercise_name="Plank",
                    description="Core strengthening exercise that builds stability and endurance",
                    applicable_sport_types=["STRENGTH"],
                    muscle_groups_primary=["core", "abs"],
                    muscle_groups_secondary=["shoulders", "back"],
                    equipment_needed=["NO_EQUIPMENT"],
                    difficulty="Beginner",
                    prescribed_sets_reps_duration="3 sets of 30-60 seconds",
                    voice_script_cue_text="Hold straight line from head to heels, engage core, breathe steadily",
                    video_url="https://example.com/plank"
                )
            ]
        else:
            # Default exercises for other sport types
            mock_exercises = [
                GenAIExercise(
                    sequence_order=1,
                    exercise_name="Jumping Jacks",
                    description="Full body cardio exercise",
                    applicable_sport_types=[sport_type],
                    muscle_groups_primary=["full_body"],
                    muscle_groups_secondary=["cardiovascular"],
                    equipment_needed=["NO_EQUIPMENT"],
                    difficulty="Beginner",
                    prescribed_sets_reps_duration="3 sets of 30 seconds",
                    voice_script_cue_text="Jump feet apart while raising arms overhead, return to start",
                    video_url="https://example.com/jumping-jacks"
                )
            ]
        
        mock_workout = GenAIDailyWorkout(
            day_date=day_date,
            focus_sport_type_for_the_day=sport_type,
            scheduled_exercises=mock_exercises
        )
        
        response = GenAIResponse(daily_workout=mock_workout)
        print(f"Generated mock workout for {sport_type} on {day_date}")
        return response
        
    except Exception as e:
        print(f"Error generating mock workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workout plan: {str(e)}")

    # Original implementation (commented out for testing)
    # try:
    #     context_str = json.dumps(context.dict(), indent=2)
    #     response = chain.invoke({"context": context_str})
    #     return response
    # except Exception as e:
    #     print(f"Error during LangChain invocation: {e}")
    #     raise HTTPException(status_code=500, detail=f"Failed to generate workout plan: {str(e)}")
