# 🧠 FlexFit GenAI Integration

## Overview

The FlexFit GenAI integration provides **dual AI processing modes** for workout plan generation:

- **🌐 Cloud AI**: Uses Claude/OpenAI models via Open WebUI API
- **🏠 Local AI**: Uses local models (GPT4All, Ollama) for privacy-preserving processing

## Architecture

```
Frontend → Workout-Plan-Service → [Cloud Worker | Local Worker]
   ↓              ↓                      ↓              ↓
 User selects  Routes based      Claude/OpenAI    GPT4All/Ollama
"Cloud/Local"  on preference     (External API)   (Local Models)
```

## ✨ Features

### 🌐 Cloud AI Worker (`workout-worker.py`)
- **Model**: Claude 3.5 Sonnet via Open WebUI
- **Port**: 8083
- **Features**: 
  - Advanced reasoning and creativity
  - Access to latest training data
  - Fast response times
  - Detailed exercise instructions

### 🏠 Local AI Worker (`workout-worker-local.py`)
- **Models**: GPT4All, Ollama, or Mock mode
- **Port**: 8084
- **Features**:
  - **Privacy-preserving** (data never leaves your machine)
  - Works offline
  - No API costs
  - Customizable local models
  - Mock mode for development

### 🔀 Smart Routing
- **Workout-Plan-Service** automatically routes requests based on `aiPreference`
- **Frontend** provides seamless selection between cloud and local
- **Same API contract** for both workers ensures consistency

## 🚀 Quick Start

### 1. Using Docker Compose (Recommended)

```bash
# Start all services including both AI workers
docker-compose up -d

# Cloud worker will be available at: http://localhost:8083
# Local worker will be available at: http://localhost:8084
```

### 2. Using Local Development

```bash
# Terminal 1: Start Cloud GenAI Worker
cd genai
pip install -r requirements.txt
python workout-worker.py

# Terminal 2: Start Local GenAI Worker  
pip install -r requirements-local.txt
python workout-worker-local.py

# Terminal 3: Test both workers
./test-genai-worker.sh        # Test cloud worker
./test-genai-worker-local.sh  # Test local worker
```

## ⚙️ Configuration

### Cloud Worker Environment Variables

```bash
# Open WebUI Configuration
OPEN_WEBUI_BASE_URL=https://gpu.aet.cit.tum.de
CHAIR_API_KEY=your_chair_api_key
MODEL_NAME=gpt-3.5-turbo

# Development
MOCK_MODE=false  # Set to true for testing without API
```

### Local Worker Environment Variables

```bash
# Local Model Configuration
LOCAL_MODEL_TYPE=mock      # mock, gpt4all, ollama
MOCK_MODE=true            # Enable for development
GPT4ALL_MODEL_PATH=/app/models/ggml-gpt4all-j-v1.3-groovy.bin
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## 🧪 Testing

### Test Cloud Worker
```bash
./test-genai-worker.sh
```

### Test Local Worker
```bash
./test-genai-worker-local.sh
```

### Test Frontend Integration
1. Open http://localhost:3000
2. Select AI preference in settings:
   - **Cloud**: Uses Claude/OpenAI
   - **Local**: Uses local models
3. Generate workouts and verify routing

## 📋 API Endpoints

Both workers expose identical APIs:

### Health Check
```http
GET /health
```

### Generate Single Workout
```http
POST /generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_profile": {...},
  "user_preferences": {...},
  "daily_focus": {...},
  "text_prompt": "Custom workout request"
}
```

### Generate Weekly Plan
```http
POST /generate-weekly
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_profile": {...},
  "user_preferences": {...},
  "text_prompt": "Weekly plan requirements"
}
```

## 🔧 Local Model Setup

### Option 1: GPT4All (Recommended for beginners)
```bash
# Install GPT4All
pip install gpt4all

# Download a model (example)
mkdir -p genai/models
cd genai/models
wget https://gpt4all.io/models/ggml-gpt4all-j-v1.3-groovy.bin

# Configure
export LOCAL_MODEL_TYPE=gpt4all
export GPT4ALL_MODEL_PATH=./models/ggml-gpt4all-j-v1.3-groovy.bin
export MOCK_MODE=false
```

### Option 2: Ollama (Advanced users)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Configure
export LOCAL_MODEL_TYPE=ollama
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=llama2
export MOCK_MODE=false
```

### Option 3: Mock Mode (Development)
```bash
# No installation required - uses built-in mock responses
export LOCAL_MODEL_TYPE=mock
export MOCK_MODE=true
```

## 📊 Performance Comparison

| Feature | Cloud AI | Local AI |
|---------|----------|----------|
| **Response Time** | 2-5 seconds | 10-60 seconds |
| **Quality** | Excellent | Good |
| **Privacy** | Data sent to API | Complete privacy |
| **Cost** | API costs | Free after setup |
| **Offline** | ❌ No | ✅ Yes |
| **Setup** | Easy | Moderate |

## 🔒 Privacy & Security

### Cloud Worker
- Data is sent to Open WebUI API
- API key required
- Subject to external service terms

### Local Worker
- **Data never leaves your machine**
- No external API calls
- Complete privacy and control
- Ideal for sensitive data

## 🛠️ Development

### Adding New Local Models

1. Create a new LLM class in `workout-worker-local.py`:
```python
class YourCustomLLM(LocalLLM):
    def _call(self, prompt: str, **kwargs) -> str:
        # Your implementation
        return response
```

2. Update the factory function:
```python
def create_local_llm():
    if LOCAL_MODEL_TYPE == "your_model":
        return YourCustomLLM()
    # ... existing models
```

### Mock Mode Customization

Modify the `MockLocalLLM` class to generate custom responses for testing specific scenarios.

## 📈 Monitoring

Both workers expose Prometheus metrics at `/metrics`:

- Request counts and durations
- Generation success/failure rates
- Model-specific performance metrics

## ❓ Troubleshooting

### Common Issues

1. **Cloud worker fails to connect**
   - Check `CHAIR_API_KEY` is set correctly
   - Verify `OPEN_WEBUI_BASE_URL` is accessible
   - Enable `MOCK_MODE=true` for testing

2. **Local worker startup fails**
   - Check model files exist in correct path
   - Verify dependencies are installed
   - Start with `MOCK_MODE=true` first

3. **Frontend not routing correctly**
   - Check workout-plan-service logs
   - Verify both workers are running
   - Test endpoints directly with curl

### Debug Mode

Enable detailed logging:
```bash
export LOG_LEVEL=DEBUG
```

## 🎯 Use Cases

### Cloud AI - Best for:
- Production environments
- High-quality creative workouts
- Fast response requirements
- Users comfortable with cloud processing

### Local AI - Best for:
- Privacy-sensitive environments
- Offline usage
- Cost-conscious deployments
- Learning and experimentation

## 🔄 Future Enhancements

- [ ] RAG integration with Weaviate for local workers
- [ ] Model fine-tuning on workout data
- [ ] Hybrid mode (local + cloud combination)
- [ ] Model quantization for faster local inference
- [ ] GPU acceleration for local models

## 📚 References

- [LangChain Documentation](https://python.langchain.com/)
- [GPT4All Models](https://gpt4all.io/)
- [Ollama Documentation](https://ollama.ai/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

## 🎉 Result

You now have a **complete dual AI processing system** that provides:

✅ **Cloud AI** for high-quality, fast workout generation  
✅ **Local AI** for privacy-preserving, offline processing  
✅ **Seamless frontend integration** with user preference selection  
✅ **Identical API contracts** ensuring consistent behavior  
✅ **Docker containerization** for easy deployment  
✅ **Comprehensive testing** for both workers  

The system automatically routes requests to the appropriate AI worker based on user preference, providing flexibility and choice! 🚀 