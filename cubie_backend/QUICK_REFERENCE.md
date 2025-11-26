# Cubie AI - Quick Reference Card

## 🚀 Quick Start

```bash
# Setup
cp .env.example .env
pip install -e .
python setup_check.py

# Run
python main.py
```

## 📁 Project Structure

```
cubie_backend/
├── app/
│   ├── agents/              # Router + Specialized Agents
│   ├── auth/                # Convex JWT Authentication
│   ├── db/                  # MongoDB Services
│   ├── memory/              # Conversation Memory
│   ├── models/              # Data Models
│   ├── orchestrator/        # Main Orchestrator
│   ├── rag/                 # Knowledge Base (RAG)
│   ├── schemas/             # API Schemas
│   └── app.py              # FastAPI App
├── main.py                  # Entry Point
└── setup_check.py          # Setup Verification
```

## 🤖 Agents

| Agent          | Purpose                       | Key Tools                                                 |
| -------------- | ----------------------------- | --------------------------------------------------------- |
| **Router**     | Classify & route queries      | N/A (uses LLM)                                            |
| **CubeDev**    | Personal coach for solve data | `analyze_performance`, `analyze_splits`, `training_plan`  |
| **WCA**        | Official competition data     | `get_competitions`, `get_rankings`, `get_records`         |
| **Web Search** | Curated web search            | `search_tutorials`, `search_algorithms`, `search_reviews` |

## 📊 API Endpoints

### Chat

```bash
POST   /chat                 # Send message
POST   /chat/session         # Create session
GET    /chat/sessions        # List sessions
GET    /chat/session/{id}    # Get history
DELETE /chat/session/{id}    # Delete session
POST   /chat/feedback        # Submit feedback
```

### System

```bash
GET    /health               # Health check
GET    /                     # API info
```

## 🔐 Authentication

```bash
Authorization: Bearer <convex_jwt_token>
```

## 🧠 Memory Strategies

| Messages | Strategy    | Behavior            |
| -------- | ----------- | ------------------- |
| < 10     | **Buffer**  | Full history        |
| 10-30    | **Window**  | Last 10 messages    |
| > 30     | **Summary** | Summarized + recent |

## 📝 Example Request

```bash
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How to improve F2L?",
    "use_rag": true
  }'
```

## 🔧 Environment Variables

**Required**:

- `MONGODB_URI` - MongoDB connection
- `GEMINI_API_KEY` - Google Gemini key
- `TAVILY_API_KEY` - Tavily search key
- `CONVEX_URL` - Convex deployment URL

**Optional**:

- `DEBUG` - Debug mode (default: false)
- `LOG_LEVEL` - Logging level (default: INFO)
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - Rate limit (default: 60)

## 🗄️ Data Models

### ChatSession

```python
{
  "user_id": str,
  "title": str,
  "created_at": datetime,
  "updated_at": datetime
}
```

### Message

```python
{
  "chat_session_id": ObjectId,
  "user_id": str,
  "role": "user" | "bot",
  "content": str,
  "metadata": MessageMetadata,
  "created_at": datetime
}
```

## ⚡ Processing Flow

```
1. Save User Message
2. Load Conversation Context
3. RAG Retrieval (if enabled)
4. Router Classification
5. Execute Agents (parallel)
6. Synthesize Responses
7. Generate Final Response
8. Save Bot Message
```

## 🎯 Query Categories

- `wca_competition` - Competition info
- `wca_rankings` - Rankings & records
- `personal_performance` - User's solves
- `training_advice` - Training tips
- `cubing_knowledge` - Algorithms, methods
- `product_review` - Cube reviews
- `cubing_news` - Latest updates
- `general_chat` - Casual conversation

## 🔍 Debugging

```bash
# Enable debug mode
DEBUG=true LOG_LEVEL=DEBUG python main.py

# Run setup checks
python setup_check.py

# Check API docs
open http://localhost:8000/docs
```

## 📦 Key Dependencies

- `fastapi` - Web framework
- `langchain` - LLM orchestration
- `langgraph` - Agent workflows
- `pymongo` - MongoDB
- `langchain-google-genai` - Gemini integration
- `langchain-mongodb` - Vector search
- `langchain-tavily` - Web search

## 🚢 Deployment

```bash
# Production checklist
- Set DEBUG=false
- Configure CORS_ORIGINS
- Use secrets manager
- Enable monitoring
- Set up backups
- Configure SSL/TLS
```

## 🧪 Testing

```bash
# Run tests
pytest tests/

# Code quality
black app/
ruff app/
mypy app/
```

## 📚 Documentation

- **System Docs**: `SYSTEM_DOCUMENTATION.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **API Docs**: http://localhost:8000/docs
- **README**: `README.md`

## 🆘 Common Issues

### Connection Errors

```bash
# Check MongoDB
python setup_check.py

# Check environment
cat .env | grep MONGODB_URI
```

### Authentication Errors

```bash
# Verify Convex URL
cat .env | grep CONVEX_URL

# Check token in request
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/health
```

### Rate Limiting

```bash
# Adjust rate limit
RATE_LIMIT_REQUESTS_PER_MINUTE=120
```

## 💡 Tips

- Use `use_rag: true` for knowledge-based queries
- Session IDs are auto-created if not provided
- Metadata includes tool usage and sources
- Feedback improves future responses
- Check `/health` for service status

---

**Quick Help**: `python setup_check.py` | **API Docs**: `/docs` | **Support**: support@cubedev.xyz
