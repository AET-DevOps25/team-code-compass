#!/usr/bin/env python3

import os
import json
import requests
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import Response
from pydantic import BaseModel, Field

# Core LangChain imports
from langchain.llms.base import LLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.callbacks.manager import CallbackManagerForLLMRun

# Local LLM imports
try:
    import gpt4all
    GPT4ALL_AVAILABLE = True
except ImportError:
    GPT4ALL_AVAILABLE = False

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

# Weaviate and RAG imports
try:
    import weaviate
    from sentence_transformers import SentenceTransformer
    WEAVIATE_AVAILABLE = True
except ImportError:
    WEAVIATE_AVAILABLE = False

# Monitoring
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Environment Configuration
MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "llama3")
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "./models/")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# Local LLM Configuration
LOCAL_LLM_TYPE = os.getenv("LOCAL_LLM_TYPE", "ollama")  # ollama, gpt4all, transformers
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Weaviate RAG Configuration  
WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
KNOWLEDGE_BASE_PATH = os.getenv("KNOWLEDGE_BASE_PATH", "./knowledge_base/")

print(f"🏠 Local GenAI Worker Starting with:")
print(f"   LOCAL_LLM_TYPE: {LOCAL_LLM_TYPE}")
print(f"   MODEL_NAME: {MODEL_NAME}")
print(f"   WEAVIATE_URL: {WEAVIATE_URL}")
print(f"   GPT4ALL_AVAILABLE: {GPT4ALL_AVAILABLE}")
print(f"   OLLAMA_AVAILABLE: {OLLAMA_AVAILABLE}")
print(f"   TRANSFORMERS_AVAILABLE: {TRANSFORMERS_AVAILABLE}")
print(f"   WEAVIATE_AVAILABLE: {WEAVIATE_AVAILABLE}")

# Data Models (same as cloud worker for consistency)
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
    markdown_content: str

class GenAIResponse(BaseModel):
    daily_workout: GenAIDailyWorkout

class GenAIWeeklyResponse(BaseModel):
    workouts: List[GenAIDailyWorkout]

class PromptContext(BaseModel):
    user_profile: Dict[str, Any]
    user_preferences: Dict[str, Any] 
    daily_focus: Dict[str, Any]
    last_7_days_exercises: List[Dict[str, Any]] = []
    text_prompt: str = ""

class WeeklyPromptContext(BaseModel):
    user_profile: Dict[str, Any]
    user_preferences: Dict[str, Any]
    text_prompt: str = ""
    last_7_days_exercises: List[Dict[str, Any]] = []

# Local LLM Classes
class LocalOllamaLLM(LLM):
    """Local Ollama LLM integration"""
    
    def __init__(self, model_name: str = "llama3"):
        super().__init__()
        self.model_name = model_name
        if not OLLAMA_AVAILABLE:
            raise Exception("Ollama library not available")
        try:
            print(f"🦙 Testing Ollama connection for model: {model_name}")
            response = ollama.chat(model=model_name, messages=[{"role": "user", "content": "Hello"}])
            print(f"✅ Ollama model {model_name} is ready")
        except Exception as e:
            print(f"❌ Ollama model test failed: {e}")
            raise

    def _call(self, prompt: str, stop: Optional[List[str]] = None,
              run_manager: Optional[CallbackManagerForLLMRun] = None, **kwargs: Any) -> str:
        try:
            response = ollama.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            return response['message']['content'].strip()
        except Exception as e:
            print(f"Ollama generation error: {e}")
            raise Exception(f"Local Ollama model failed: {str(e)}")

    @property 
    def _llm_type(self) -> str:
        return "local_ollama"

class LocalGPT4AllLLM(LLM):
    """Local GPT4All LLM integration"""
    
    def __init__(self, model_name: str = "orca-mini-3b.ggmlv3.q4_0.bin"):
        super().__init__()
        self.model_name = model_name
        if not GPT4ALL_AVAILABLE:
            raise Exception("GPT4All library not available")
        try:
            print(f"🧠 Loading GPT4All model: {model_name}")
            self.model = gpt4all.GPT4All(model_name, model_path=LOCAL_MODEL_PATH)
            print(f"✅ GPT4All model loaded successfully")
        except Exception as e:
            print(f"❌ GPT4All model loading failed: {e}")
            raise

    def _call(self, prompt: str, stop: Optional[List[str]] = None, 
              run_manager: Optional[CallbackManagerForLLMRun] = None, **kwargs: Any) -> str:
        try:
            response = self.model.generate(prompt, max_tokens=2000, temp=0.7)
            return response.strip()
        except Exception as e:
            print(f"GPT4All generation error: {e}")
            raise Exception(f"Local GPT4All model failed: {str(e)}")

    @property
    def _llm_type(self) -> str:
        return "local_gpt4all"

class LocalTransformersLLM(LLM):
    """Local Transformers/Hugging Face LLM integration"""
    
    def __init__(self, model_name: str = "microsoft/DialoGPT-medium"):
        super().__init__()
        self.model_name = model_name
        if not TRANSFORMERS_AVAILABLE:
            raise Exception("Transformers library not available")
        try:
            print(f"🤗 Loading Transformers model: {model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(model_name)
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            print(f"✅ Transformers model loaded successfully")
        except Exception as e:
            print(f"❌ Transformers model loading failed: {e}")
            raise

    def _call(self, prompt: str, stop: Optional[List[str]] = None,
              run_manager: Optional[CallbackManagerForLLMRun] = None, **kwargs: Any) -> str:
        try:
            inputs = self.tokenizer.encode(prompt, return_tensors='pt', truncation=True, max_length=512)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs, 
                    max_length=inputs.shape[1] + 500,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            response = response[len(prompt):].strip()
            return response
        except Exception as e:
            print(f"Transformers generation error: {e}")
            raise Exception(f"Local Transformers model failed: {str(e)}")

    @property
    def _llm_type(self) -> str:
        return "local_transformers"

# Weaviate RAG Knowledge Base Manager
class WeaviateRAGKnowledgeBase:
    def __init__(self):
        self.embedding_model = None
        self.weaviate_client = None
        self.knowledge_loaded = False
        
        if WEAVIATE_AVAILABLE:
            self._initialize_weaviate_rag()

    def _initialize_weaviate_rag(self):
        """Initialize Weaviate RAG components"""
        try:
            print(f"🔍 Loading embedding model: {EMBEDDING_MODEL}")
            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
            
            print(f"🍇 Connecting to Weaviate at: {WEAVIATE_URL}")
            self.weaviate_client = weaviate.Client(url=WEAVIATE_URL)
            
            # Create schema for fitness knowledge
            self._create_fitness_schema()
            
            # Load fitness knowledge
            self._load_fitness_knowledge()
            print(f"✅ Weaviate RAG system initialized successfully!")
            
        except Exception as e:
            print(f"❌ Weaviate RAG initialization failed: {e}")
            self.embedding_model = None
            self.weaviate_client = None

    def _create_fitness_schema(self):
        """Create Weaviate schema for fitness knowledge"""
        try:
            schema = {
                "classes": [
                    {
                        "class": "FitnessKnowledge",
                        "description": "Fitness and workout knowledge base for evidence-based training",
                        "properties": [
                            {"name": "content", "dataType": ["text"], "description": "Knowledge content"},
                            {"name": "category", "dataType": ["string"], "description": "Knowledge category"},
                            {"name": "sport_type", "dataType": ["string"], "description": "Related sport type"},
                            {"name": "difficulty_level", "dataType": ["string"], "description": "Difficulty level"},
                            {"name": "muscle_groups", "dataType": ["string[]"], "description": "Target muscle groups"},
                            {"name": "evidence_level", "dataType": ["string"], "description": "Scientific evidence level"},
                        ]
                    }
                ]
            }
            
            # Create schema if not exists
            if not self.weaviate_client.schema.exists("FitnessKnowledge"):
                self.weaviate_client.schema.create(schema)
                print("✅ Weaviate fitness schema created")
            else:
                print("✅ Weaviate fitness schema already exists")
                
        except Exception as e:
            print(f"❌ Weaviate schema creation failed: {e}")
            raise

    def _load_fitness_knowledge(self):
        """Load comprehensive fitness knowledge into Weaviate"""
        try:
            # Comprehensive fitness knowledge base
            fitness_knowledge = [
                # Exercise Science
                {
                    "content": "Compound exercises like squats, deadlifts, bench press, and pull-ups work multiple muscle groups simultaneously and are the foundation of effective strength training. They provide functional strength, improve intermuscular coordination, and maximize training efficiency.",
                    "category": "exercise_science",
                    "sport_type": "STRENGTH",
                    "difficulty_level": "Intermediate",
                    "muscle_groups": ["Full Body", "Core"],
                    "evidence_level": "High"
                },
                {
                    "content": "Progressive overload is the cornerstone of strength development. Gradually increase weight by 2.5-5 lbs for upper body and 5-10 lbs for lower body exercises when you can complete all prescribed sets and reps with proper form.",
                    "category": "training_principles",
                    "sport_type": "STRENGTH",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["All"],
                    "evidence_level": "High"
                },
                {
                    "content": "For muscle hypertrophy, train each muscle group 2-3 times per week with 10-20 sets per muscle group per week. Rep ranges of 6-12 with 65-85% 1RM are optimal for muscle growth.",
                    "category": "muscle_building",
                    "sport_type": "STRENGTH",
                    "difficulty_level": "Intermediate",
                    "muscle_groups": ["All"],
                    "evidence_level": "High"
                },
                
                # HIIT Training
                {
                    "content": "Tabata protocol (20 seconds work, 10 seconds rest x 8 rounds) performed at maximum intensity can improve VO2max by up to 14% in 6 weeks. Apply to exercises like burpees, mountain climbers, or cycling.",
                    "category": "hiit_protocols",
                    "sport_type": "HIIT",
                    "difficulty_level": "Advanced",
                    "muscle_groups": ["Cardiovascular", "Full Body"],
                    "evidence_level": "High"
                },
                {
                    "content": "4x4 HIIT protocol (4 minutes at 85-90% HRmax, 3 minutes recovery x 4) is superior for cardiac adaptations and stroke volume improvements compared to traditional moderate intensity cardio.",
                    "category": "hiit_protocols",
                    "sport_type": "HIIT",
                    "difficulty_level": "Advanced",
                    "muscle_groups": ["Cardiovascular"],
                    "evidence_level": "High"
                },
                {
                    "content": "HIIT should be limited to 2-3 sessions per week maximum. Allow 48-72 hours recovery between high-intensity sessions to prevent overtraining and allow for physiological adaptations.",
                    "category": "recovery_hiit",
                    "sport_type": "HIIT",
                    "difficulty_level": "Intermediate",
                    "muscle_groups": ["Cardiovascular"],
                    "evidence_level": "High"
                },
                
                # Recovery and Rest
                {
                    "content": "Active recovery involving light movement (20-30 minutes at 30-50% HRmax) increases blood flow, reduces muscle stiffness, and accelerates lactate clearance better than complete rest.",
                    "category": "active_recovery",
                    "sport_type": "REST",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["Recovery"],
                    "evidence_level": "High"
                },
                {
                    "content": "Sleep is crucial for recovery. Growth hormone peaks during deep sleep phases. Athletes need 7-9 hours of quality sleep for optimal recovery, muscle protein synthesis, and performance.",
                    "category": "sleep_recovery",
                    "sport_type": "REST",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["Recovery"],
                    "evidence_level": "High"
                },
                {
                    "content": "Muscle protein synthesis remains elevated for 24-48 hours post-exercise. Consume 20-40g high-quality protein within 2 hours post-workout to maximize recovery and adaptations.",
                    "category": "nutrition_recovery",
                    "sport_type": "ALL",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["All"],
                    "evidence_level": "High"
                },
                
                # Yoga and Mobility
                {
                    "content": "Dynamic stretching before workouts improves range of motion and reduces injury risk. Static stretching post-workout aids in muscle length restoration and stress reduction.",
                    "category": "flexibility_mobility",
                    "sport_type": "YOGA_MOBILITY",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["Full Body"],
                    "evidence_level": "Moderate"
                },
                {
                    "content": "Yoga practice 2-3 times per week improves flexibility, balance, core strength, and reduces cortisol levels. Particularly beneficial for athletes in high-stress training phases.",
                    "category": "yoga_benefits",
                    "sport_type": "YOGA_MOBILITY",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["Core", "Flexibility"],
                    "evidence_level": "Moderate"
                },
                
                # Running and Cardio
                {
                    "content": "Zone 2 training (conversational pace, 60-70% HRmax) improves mitochondrial density and fat oxidation. Should comprise 80% of endurance training volume for optimal aerobic development.",
                    "category": "aerobic_training",
                    "sport_type": "RUNNING_INTERVALS",
                    "difficulty_level": "Intermediate",
                    "muscle_groups": ["Cardiovascular", "Legs"],
                    "evidence_level": "High"
                },
                {
                    "content": "Interval running workouts (400m-1600m repeats at 5K-10K pace) improve VO2max and lactate threshold. Include 1-2 interval sessions per week for competitive runners.",
                    "category": "running_intervals",
                    "sport_type": "RUNNING_INTERVALS",
                    "difficulty_level": "Advanced",
                    "muscle_groups": ["Cardiovascular", "Legs"],
                    "evidence_level": "High"
                },
                
                # Beginner Guidelines
                {
                    "content": "Beginners should focus on movement quality over intensity. Start with bodyweight exercises: push-ups, squats, lunges, planks. Master form before adding external load.",
                    "category": "beginner_training",
                    "sport_type": "STRENGTH",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["Full Body"],
                    "evidence_level": "High"
                },
                {
                    "content": "New exercisers should train 2-3 times per week, allowing 48 hours recovery between sessions. Focus on full-body workouts with 6-8 exercises per session.",
                    "category": "beginner_frequency",
                    "sport_type": "ALL",
                    "difficulty_level": "Beginner",
                    "muscle_groups": ["All"],
                    "evidence_level": "High"
                }
            ]
            
            # Add knowledge to Weaviate
            for idx, knowledge in enumerate(fitness_knowledge):
                self._add_to_weaviate(knowledge, idx)
                
            self.knowledge_loaded = True
            print(f"✅ Loaded {len(fitness_knowledge)} knowledge entries into Weaviate")
            
        except Exception as e:
            print(f"❌ Knowledge loading failed: {e}")

    def _add_to_weaviate(self, knowledge: dict, doc_id: int):
        """Add knowledge entry to Weaviate"""
        if not self.embedding_model or not self.weaviate_client:
            return
            
        try:
            # Generate embedding
            embedding = self.embedding_model.encode([knowledge["content"]])[0]
            
            # Add to Weaviate
            self.weaviate_client.data_object.create(
                knowledge, 
                "FitnessKnowledge", 
                vector=embedding.tolist(),
                uuid=None  # Let Weaviate generate UUID
            )
                
        except Exception as e:
            print(f"❌ Failed to add knowledge to Weaviate: {e}")

    def search_knowledge(self, query: str, sport_type: str = None, limit: int = 3) -> List[dict]:
        """Search for relevant fitness knowledge in Weaviate"""
        if not self.knowledge_loaded or not self.embedding_model or not self.weaviate_client:
            return []
            
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])[0]
            
            # Build Weaviate query
            where_filter = {}
            if sport_type and sport_type != "ALL":
                where_filter = {
                    "operator": "Or",
                    "operands": [
                        {"path": ["sport_type"], "operator": "Equal", "valueString": sport_type},
                        {"path": ["sport_type"], "operator": "Equal", "valueString": "ALL"}
                    ]
                }
            
            # Search Weaviate
            if where_filter:
                result = (
                    self.weaviate_client.query
                    .get("FitnessKnowledge", ["content", "category", "sport_type", "difficulty_level", "muscle_groups", "evidence_level"])
                    .with_near_vector({"vector": query_embedding.tolist()})
                    .with_where(where_filter)
                    .with_limit(limit)
                    .with_additional(["distance"])
                    .do()
                )
            else:
                result = (
                    self.weaviate_client.query
                    .get("FitnessKnowledge", ["content", "category", "sport_type", "difficulty_level", "muscle_groups", "evidence_level"])
                    .with_near_vector({"vector": query_embedding.tolist()})
                    .with_limit(limit)
                    .with_additional(["distance"])
                    .do()
                )
            
            # Process results
            knowledge_results = []
            if "data" in result and "Get" in result["data"] and "FitnessKnowledge" in result["data"]["Get"]:
                for item in result["data"]["Get"]["FitnessKnowledge"]:
                    distance = item.get("_additional", {}).get("distance", 1.0)
                    score = 1 - distance  # Convert distance to similarity score
                    
                    knowledge_results.append({
                        "content": item["content"],
                        "metadata": {
                            "category": item.get("category", ""),
                            "sport_type": item.get("sport_type", ""),
                            "difficulty_level": item.get("difficulty_level", ""),
                            "muscle_groups": item.get("muscle_groups", []),
                            "evidence_level": item.get("evidence_level", "")
                        },
                        "score": score
                    })
            
            return knowledge_results
            
        except Exception as e:
            print(f"❌ Weaviate knowledge search failed: {e}")
            return []

# Local LLM Factory
def create_local_llm():
    """Factory function to create appropriate local LLM"""
    if LOCAL_LLM_TYPE == "ollama" and OLLAMA_AVAILABLE:
        return LocalOllamaLLM(MODEL_NAME)
    elif LOCAL_LLM_TYPE == "gpt4all" and GPT4ALL_AVAILABLE:
        return LocalGPT4AllLLM()
    elif LOCAL_LLM_TYPE == "transformers" and TRANSFORMERS_AVAILABLE:
        return LocalTransformersLLM()
    else:
        raise Exception(f"Local LLM type '{LOCAL_LLM_TYPE}' not available. Available types: {[t for t, avail in [('ollama', OLLAMA_AVAILABLE), ('gpt4all', GPT4ALL_AVAILABLE), ('transformers', TRANSFORMERS_AVAILABLE)] if avail]}")

# --- Prometheus Metrics Setup ---
REQUEST_COUNT = Counter(
    'genai_local_requests_total', 
    'Total number of requests to Local GenAI service',
    ['method', 'endpoint', 'status', 'llm_type']
)
REQUEST_DURATION = Histogram(
    'genai_local_request_duration_seconds',
    'Duration of Local GenAI requests in seconds',
    ['method', 'endpoint', 'llm_type']
)
GENERATION_COUNT = Counter(
    'genai_local_workout_generations_total',
    'Total number of local workout generations',
    ['generation_type', 'status', 'llm_type']
)
GENERATION_DURATION = Histogram(
    'genai_local_generation_duration_seconds',
    'Duration of local workout generation in seconds',
    ['generation_type', 'llm_type']
)
RAG_SEARCH_COUNT = Counter(
    'genai_local_rag_searches_total',
    'Total number of local RAG knowledge searches',
    ['status']
)

# --- FastAPI Application Setup ---
app = FastAPI(
    title="FlexFit Local GenAI Workout Worker",
    description="Local AI service for personalized workout plans with local LLMs and Weaviate RAG architecture",
    version="1.0.0"
)

# Initialize components
weaviate_rag = WeaviateRAGKnowledgeBase()

# Prometheus metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.on_event("startup")
async def startup_event():
    """Initialize Local FlexFit GenAI Workout Worker"""
    print("🚀 Initializing Local FlexFit GenAI Workout Worker...")
    print(f"   🏠 Local LLM Type: {LOCAL_LLM_TYPE}")
    print(f"   🤖 Model: {MODEL_NAME}")
    print(f"   🍇 Weaviate RAG: {'✅ Enabled' if weaviate_rag.knowledge_loaded else '❌ Disabled'}")
    if MOCK_MODE:
        print("   🎭 Mock mode enabled")

# Initialize LLM and parsers
try:
    llm = create_local_llm()
    print(f"✅ Local LLM '{LOCAL_LLM_TYPE}' initialized successfully")
except Exception as e:
    print(f"❌ Local LLM initialization failed: {e}")
    llm = None

parser = JsonOutputParser(pydantic_object=GenAIResponse)
weekly_parser = JsonOutputParser(pydantic_object=GenAIWeeklyResponse)

# Enhanced prompt template with Weaviate RAG
local_prompt_template_str = """
You are an expert fitness coach and workout programmer using LOCAL AI processing with advanced knowledge integration. Create a personalized daily workout plan based on the provided user context and evidence-based fitness science.

IMPORTANT: Each workout must be UNIQUE and VARIED. Consider the specific date, user's fitness level, preferences, and create fresh content each time.

Your response MUST be a JSON object that strictly follows the format shown in the JSON Structure Example below.

User Context:
{context}

Evidence-Based Knowledge (from Weaviate RAG):
{weaviate_context}

GUIDELINES:

### LOCAL AI ENHANCEMENT
You are running on local infrastructure providing:
- Privacy-preserving processing (data stays local)
- Evidence-based recommendations from comprehensive fitness knowledge base
- Scientifically-backed training principles and methodologies

### Weaviate RAG Integration
Use the Evidence-Based Knowledge above to enhance your workout recommendations with:
- Peer-reviewed training methodologies
- Optimal rep ranges and intensities based on research
- Progressive overload principles
- Recovery and adaptation science
- Sport-specific training protocols

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
- Rep ranges (strength vs endurance based on research)  
- Set schemes (straight sets, circuits, supersets)
- Rest periods and intensity zones based on training science
- Movement patterns and muscle group focuses
- Warm-up and cool-down approaches

### Safety & Evidence-Based Programming
- Adhere to any health_notes (e.g., avoid certain movements if an injury is mentioned)
- Avoid any exercises listed in disliked_exercises
- Progress appropriately based on experience_level and research-backed progression models
- Apply evidence-based training principles from the knowledge base

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

### REST Day Handling
CRITICAL: If focus_sport_type_for_the_day is "REST":
- Set scheduled_exercises to an empty array: []
- Create recovery-focused markdown_content with light activities
- Include recommendations for hydration, sleep, and gentle movement based on recovery science
- Do NOT create any structured exercises or workouts

### Exercise Structure Requirements
Each exercise MUST include:
- sequence_order: integer (1, 2, 3, etc.)
- exercise_name: string (clear, descriptive name)
- description: string (detailed explanation with form cues based on exercise science)
- applicable_sport_types: array of SportType enum values
- muscle_groups_primary: array of strings (main muscles targeted)
- muscle_groups_secondary: array of strings (supporting muscles)
- equipment_needed: array of EquipmentItem enum values
- difficulty: string ("Beginner", "Intermediate", or "Advanced")
- prescribed_sets_reps_duration: string (e.g., "3 sets of 12 reps", "45 seconds") based on training goals
- voice_script_cue_text: string (coaching cues for proper form based on movement science)
- video_url: string or null (optional video reference)

### Markdown Content Requirements
Generate comprehensive markdown_content including:
- Workout title and overview
- Warm-up section (5-10 minutes) based on movement preparation science
- Main workout with exercise tables
- Cool-down section (5-10 minutes) based on recovery research
- Evidence-based tips and scientific rationale
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
7. Generate rich markdown_content with proper formatting and scientific backing

### Day-Specific Variation
Consider the specific day_date and create content that feels fresh and different from previous workouts while maintaining consistency with user preferences and evidence-based programming.

### Custom Instructions
If a text_prompt is provided in the context, incorporate those specific instructions and preferences into the workout design. This may include:
- Specific exercise requests or modifications
- Focus areas or training goals for the day
- Recovery or rest day specifications
- Special considerations or adaptations

### Local AI Processing Note
Emphasize in your response that this workout was generated using local AI processing for privacy and includes evidence-based recommendations from a comprehensive fitness knowledge base.

### JSON Structure Example
{{
  "daily_workout": {{
    "day_date": "2025-01-13",
    "focus_sport_type_for_the_day": "HIIT",
    "scheduled_exercises": [
      {{
        "sequence_order": 1,
        "exercise_name": "Burpees",
        "description": "Full body exercise combining squat, plank, and jump - based on research showing compound movement benefits",
        "applicable_sport_types": ["HIIT"],
        "muscle_groups_primary": ["Full Body"],
        "muscle_groups_secondary": ["Core"],
        "equipment_needed": ["NO_EQUIPMENT"],
        "difficulty": "Intermediate",
        "prescribed_sets_reps_duration": "3 sets of 10 reps",
        "voice_script_cue_text": "Keep your core tight throughout the movement - maintain proper form as per movement science",
        "video_url": null
      }}
    ],
    "markdown_content": "# HIIT Workout - Local AI Generated\\n\\n*Generated using local AI processing with evidence-based fitness science*\\n\\n## Warm-up\\n- Light jogging in place: 2 minutes\\n\\n## Main Workout\\n\\n| Exercise | Sets | Reps | Rest |\\n|----------|------|------|------|\\n| Burpees | 3 | 10 | 60s |\\n| Mountain Climbers | 3 | 20 | 45s |\\n\\n## Cool Down\\n- Static stretching: 5 minutes\\n\\n## Training Science\\nThis HIIT protocol follows research-backed principles for optimal cardiovascular adaptation."
  }}
}}
"""

# Create enhanced prompt template
local_prompt = PromptTemplate(
    template=local_prompt_template_str,
    input_variables=["context", "weaviate_context"],
)

# Create enhanced chains
if llm:
    local_chain = local_prompt | llm | parser
else:
    local_chain = None

# --- API Endpoints ---
@app.get("/health", summary="Health Check")
async def health_check():
    return {
        "status": "healthy", 
        "service": "local-genai-worker",
        "llm_type": LOCAL_LLM_TYPE,
        "model": MODEL_NAME,
        "weaviate_rag": weaviate_rag.knowledge_loaded,
        "available_llms": {
            "ollama": OLLAMA_AVAILABLE,
            "gpt4all": GPT4ALL_AVAILABLE,
            "transformers": TRANSFORMERS_AVAILABLE
        }
    }

@app.post("/generate", response_model=GenAIResponse, summary="Generate Local Workout Plan with Weaviate RAG")
async def generate_workout(context: PromptContext, authorization: Optional[str] = Header(None)):
    """Generate workout plan using local LLM with Weaviate RAG enhancement"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    REQUEST_COUNT.labels(method='POST', endpoint='/generate', status='request', llm_type=LOCAL_LLM_TYPE).inc()
    
    # Mock mode for testing
    if MOCK_MODE:
        GENERATION_COUNT.labels(generation_type='daily', status='success', llm_type='mock').inc()
        return generate_mock_response(context)
    
    if not llm:
        raise HTTPException(status_code=503, detail="Local LLM not available")
    
    try:
        with GENERATION_DURATION.labels(generation_type='daily', llm_type=LOCAL_LLM_TYPE).time():
            # Build context string
            context_str = json.dumps(context.dict(), indent=2)
            
            # Get Weaviate RAG-enhanced context
            weaviate_context = ""
            if weaviate_rag.knowledge_loaded:
                sport_type = context.daily_focus.get("focus_sport_type_for_the_day", "")
                search_query = f"{sport_type} workout exercise programming training principles"
                
                rag_results = weaviate_rag.search_knowledge(search_query, sport_type, limit=5)
                RAG_SEARCH_COUNT.labels(status='success').inc()
                
                if rag_results:
                    weaviate_context = "Evidence-Based Fitness Science from Weaviate Knowledge Base:\n\n"
                    for i, result in enumerate(rag_results, 1):
                        evidence_level = result['metadata'].get('evidence_level', 'Moderate')
                        category = result['metadata'].get('category', 'General')
                        weaviate_context += f"{i}. [{evidence_level} Evidence] {category.title()}:\n   {result['content']}\n\n"
                else:
                    weaviate_context = "Using general fitness science principles from local knowledge base."
            else:
                weaviate_context = "Applying evidence-based fitness principles and training science."
            
            # Generate with local LLM and Weaviate RAG
            response = local_chain.invoke({
                "context": context_str,
                "weaviate_context": weaviate_context
            })
            
            GENERATION_COUNT.labels(generation_type='daily', status='success', llm_type=LOCAL_LLM_TYPE).inc()
            REQUEST_COUNT.labels(method='POST', endpoint='/generate', status='success', llm_type=LOCAL_LLM_TYPE).inc()
            
            return response
            
    except Exception as e:
        print(f"Error during local LangChain invocation: {e}")
        GENERATION_COUNT.labels(generation_type='daily', status='error', llm_type=LOCAL_LLM_TYPE).inc()
        REQUEST_COUNT.labels(method='POST', endpoint='/generate', status='error', llm_type=LOCAL_LLM_TYPE).inc()
        raise HTTPException(status_code=500, detail=f"Failed to generate local workout plan: {str(e)}")

@app.post("/generate-weekly", response_model=GenAIWeeklyResponse, summary="Generate Local Weekly Workout Plan")
async def generate_weekly_workout(context: WeeklyPromptContext, authorization: Optional[str] = Header(None)):
    """Generate weekly workout plan using local LLM with Weaviate RAG enhancement"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    REQUEST_COUNT.labels(method='POST', endpoint='/generate-weekly', status='request', llm_type=LOCAL_LLM_TYPE).inc()
    
    # Mock mode for testing
    if MOCK_MODE:
        GENERATION_COUNT.labels(generation_type='weekly', status='success', llm_type='mock').inc()
        return generate_mock_weekly_response(context)
    
    if not llm:
        raise HTTPException(status_code=503, detail="Local LLM not available")
    
    try:
        with GENERATION_DURATION.labels(generation_type='weekly', llm_type=LOCAL_LLM_TYPE).time():
            # Get dates for the next 7 days starting from today
            today = datetime.now().date()
            dates = [(today + timedelta(days=i)).isoformat() for i in range(7)]
            
            # Add dates to context
            context_dict = context.dict()
            context_dict['start_date'] = dates[0]
            context_dict['dates'] = dates
            
            context_str = json.dumps(context_dict, indent=2)
            
            # Get Weaviate context for weekly planning
            weaviate_context = ""
            if weaviate_rag.knowledge_loaded:
                search_query = "weekly workout programming training principles progressive overload recovery periodization"
                rag_results = weaviate_rag.search_knowledge(search_query, limit=5)
                RAG_SEARCH_COUNT.labels(status='success').inc()
                
                if rag_results:
                    weaviate_context = "Weekly Training Science from Weaviate Knowledge Base:\n\n"
                    for i, result in enumerate(rag_results, 1):
                        evidence_level = result['metadata'].get('evidence_level', 'Moderate')
                        category = result['metadata'].get('category', 'General')
                        weaviate_context += f"{i}. [{evidence_level} Evidence] {category.title()}:\n   {result['content']}\n\n"
                else:
                    weaviate_context = "Applying evidence-based weekly programming principles."
            else:
                weaviate_context = "Using established training science for weekly periodization."
            
            # Create weekly prompt and chain
            weekly_prompt = PromptTemplate(
                template="Create a 7-day workout plan using local AI with evidence-based principles. Context: {context}\n\n{weaviate_context}",
                input_variables=["context", "weaviate_context"],
            )
            weekly_chain = weekly_prompt | llm | weekly_parser
            
            response = weekly_chain.invoke({
                "context": context_str,
                "weaviate_context": weaviate_context
            })
            
            GENERATION_COUNT.labels(generation_type='weekly', status='success', llm_type=LOCAL_LLM_TYPE).inc()
            REQUEST_COUNT.labels(method='POST', endpoint='/generate-weekly', status='success', llm_type=LOCAL_LLM_TYPE).inc()
            
            return response
            
    except Exception as e:
        print(f"Error during local weekly LangChain invocation: {e}")
        GENERATION_COUNT.labels(generation_type='weekly', status='error', llm_type=LOCAL_LLM_TYPE).inc()
        REQUEST_COUNT.labels(method='POST', endpoint='/generate-weekly', status='error', llm_type=LOCAL_LLM_TYPE).inc()
        raise HTTPException(status_code=500, detail=f"Failed to generate local weekly workout plan: {str(e)}")

@app.get("/knowledge/search", summary="Search Weaviate Fitness Knowledge Base")
async def search_knowledge_base(
    query: str, 
    sport_type: Optional[str] = None, 
    limit: int = 5,
    authorization: Optional[str] = Header(None)
):
    """Search the Weaviate knowledge base directly"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    if not weaviate_rag.knowledge_loaded:
        raise HTTPException(status_code=503, detail="Weaviate knowledge base not available")
    
    try:
        results = weaviate_rag.search_knowledge(query, sport_type, limit)
        RAG_SEARCH_COUNT.labels(status='success').inc()
        return {
            "query": query,
            "sport_type": sport_type,
            "service": "local-weaviate-rag",
            "results": results
        }
    except Exception as e:
        RAG_SEARCH_COUNT.labels(status='error').inc()
        raise HTTPException(status_code=500, detail=f"Weaviate knowledge search failed: {str(e)}")

# Mock functions for testing
def generate_mock_response(context: PromptContext) -> GenAIResponse:
    """Generate a mock workout response for testing purposes"""
    sport_type = context.daily_focus.get("focus_sport_type_for_the_day", "STRENGTH")
    duration = context.daily_focus.get("target_total_duration_minutes", 45)
    date = context.daily_focus.get("day_date", "2025-01-19")
    
    mock_exercises = []
    
    if sport_type == "STRENGTH":
        mock_exercises = [
            GenAIExercise(
                sequence_order=1,
                exercise_name="Local AI Compound Movement",
                description="Evidence-based compound exercise generated using local AI with privacy protection",
                applicable_sport_types=["STRENGTH"],
                muscle_groups_primary=["Chest", "Shoulders"],
                muscle_groups_secondary=["Triceps", "Core"],
                equipment_needed=["DUMBBELLS_PAIR_MEDIUM"],
                difficulty="Intermediate",
                prescribed_sets_reps_duration="3 sets x 8-12 reps (research-backed hypertrophy range)",
                voice_script_cue_text="Maintain proper form based on movement science - generated by local AI"
            )
        ]
    elif sport_type == "REST":
        mock_exercises = []
    
    if sport_type == "REST":
        markdown_content = f"""# Local AI Rest Day - {date}

*Generated using privacy-preserving local AI with evidence-based recovery science*

## Rest Day Overview
- **Duration**: Full day recovery
- **Focus**: Evidence-based recovery protocols
- **AI Processing**: Local (data stays private)

## Research-Backed Recovery Recommendations
- Light movement for 20-30 minutes at 30-50% HRmax (improves blood flow)
- Focus on hydration and anti-inflammatory nutrition
- Target 7-9 hours quality sleep for growth hormone optimization
- Practice stress-reduction techniques (reduces cortisol)

## Weaviate Knowledge Integration
This rest day plan incorporates scientific evidence from our comprehensive fitness knowledge base, ensuring optimal recovery based on peer-reviewed research.
"""
    else:
        markdown_content = f"""# Local AI {sport_type} Workout - {date}

*Generated using privacy-preserving local AI with Weaviate RAG enhancement*

## Workout Overview
- **Duration**: {duration} minutes
- **Equipment**: Evidence-based selection
- **Focus**: {sport_type}
- **AI Processing**: Local (complete privacy)

## Training Science Integration
This workout incorporates evidence-based principles from our Weaviate knowledge base:
- Progressive overload methodology
- Optimal rep ranges for training adaptations
- Recovery-focused programming

## Exercises

### 1. Local AI Compound Movement
- **Sets/Reps**: 3 sets x 8-12 reps (research-backed)
- **Primary Muscles**: Chest, Shoulders
- **Local AI Coaching**: Proper form based on movement science
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
    today = datetime.now().date()
    workouts = []
    
    workout_plan = [
        ("STRENGTH", "Local AI Upper Push"),
        ("STRENGTH", "Local AI Lower Power"),
        ("YOGA_MOBILITY", "Local AI Recovery Flow"),
        ("REST", "Local AI Active Rest"),
        ("STRENGTH", "Local AI Upper Pull"),
        ("HIIT", "Local AI HIIT Blast"),
        ("REST", "Local AI Complete Rest")
    ]
    
    for i, (sport_type, workout_name) in enumerate(workout_plan):
        date = (today + timedelta(days=i)).isoformat()
        
        exercises = []
        if sport_type != "REST":
            exercises = [
                GenAIExercise(
                    sequence_order=1,
                    exercise_name=f"{workout_name} Exercise",
                    description=f"Evidence-based {sport_type} exercise generated using local AI with Weaviate RAG",
                    applicable_sport_types=[sport_type],
                    muscle_groups_primary=["Full Body"],
                    muscle_groups_secondary=[],
                    equipment_needed=["NO_EQUIPMENT"],
                    difficulty="Intermediate",
                    prescribed_sets_reps_duration="3 sets x 10 reps (research-backed)",
                    voice_script_cue_text=f"Local AI coaching with movement science principles"
                )
            ]
        
        if sport_type == "REST":
            markdown_content = f"""# {sport_type} - {workout_name}
Date: {date}

## Local AI Rest Day with Weaviate RAG
- **Focus**: Evidence-based recovery
- **AI Processing**: Local (privacy-preserving)
- **Knowledge Source**: Weaviate fitness science database

## Research-Backed Recommendations
- Active recovery protocols based on peer-reviewed studies
- Sleep optimization for recovery hormone production
- Nutrition timing for muscle protein synthesis
"""
        else:
            markdown_content = f"""# {sport_type} - {workout_name}
Date: {date}

## Local AI Workout with Weaviate RAG Enhancement
- **Focus**: {sport_type}
- **AI Processing**: Local (complete privacy)
- **Knowledge Integration**: Evidence-based fitness science

### 1. {workout_name} Exercise
- **Sets/Reps**: 3 sets x 10 reps (research-backed)
- **Local AI Enhancement**: Generated with movement science principles
- **Weaviate Knowledge**: Incorporates peer-reviewed training methodologies
"""
        
        workout = GenAIDailyWorkout(
            day_date=date,
            focus_sport_type_for_the_day=sport_type,
            scheduled_exercises=exercises,
            markdown_content=markdown_content
        )
        workouts.append(workout)
    
    return GenAIWeeklyResponse(workouts=workouts)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "workout-worker-local:app", 
        host="0.0.0.0", 
        port=8001,  # Different port from cloud worker
        reload=True,
        log_level="info"
    ) 