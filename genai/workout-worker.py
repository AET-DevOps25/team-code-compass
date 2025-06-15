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
    
    try:
        context_str = json.dumps(context.dict(), indent=2)
        response = chain.invoke({"context": context_str})
        return response
    except Exception as e:
        print(f"Error during LangChain invocation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workout plan: {str(e)}")
