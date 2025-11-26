# Cubie AI - Complete Agentic RAG System Documentation

## Overview

Cubie AI is a sophisticated agentic RAG (Retrieval-Augmented Generation) system built for the CubeDev speedcubing platform. It provides intelligent, context-aware responses to user queries about speedcubing through a multi-agent architecture with specialized capabilities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                   Convex Authentication                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST + JWT Token
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Authentication Middleware                      │  │
│  │         - Convex JWT Verification                     │  │
│  │         - Rate Limiting                               │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                        │
│  ┌───────────────────▼───────────────────────────────────┐  │
│  │            Cubie Orchestrator                         │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  1. Load Conversation Memory (MongoDB)          │ │  │
│  │  │  2. RAG Retrieval (Knowledge Base)              │ │  │
│  │  │  3. Router Agent (Query Classification)         │ │  │
│  │  │  4. Specialized Agent Execution                 │ │  │
│  │  │  5. Response Synthesis                          │ │  │
│  │  │  6. Save to Database                            │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                        │
│         ┌────────────┼────────────┬───────────────┐          │
│         │            │            │               │          │
│    ┌────▼────┐  ┌───▼────┐  ┌───▼────┐     ┌───▼────┐     │
│    │ Router  │  │CubeDev │  │  WCA   │     │  Web   │     │
│    │ Agent   │  │ Agent  │  │ Agent  │     │ Search │     │
│    └────┬────┘  └───┬────┘  └───┬────┘     └───┬────┘     │
│         │           │           │               │          │
└─────────┼───────────┼───────────┼───────────────┼──────────┘
          │           │           │               │
     ┌────▼───────────▼───────────▼───────────────▼──────┐
     │                                                     │
     │              External Services                     │
     │  ┌─────────────────────────────────────────────┐  │
     │  │  - MongoDB Atlas (Storage + Vector Search)  │  │
     │  │  - Google Gemini (LLM)                      │  │
     │  │  - Tavily (Web Search)                      │  │
     │  │  - WCA API (Competition Data)               │  │
     │  │  - Convex (User Data)                       │  │
     │  └─────────────────────────────────────────────┘  │
     └─────────────────────────────────────────────────────┘
```

## Core Components

### 1. Router Agent (`app/agents/router_agent.py`)

**Purpose**: Intelligently classifies user queries and routes to appropriate specialized agents.

**Key Features**:

- Query classification into categories (WCA, personal performance, training, etc.)
- Confidence scoring
- Multi-agent routing for complex queries
- Structured output using Pydantic models

**Query Categories**:

- `wca_competition` - Competition info, schedules, registration
- `wca_rankings` - Rankings, records, competitor profiles
- `personal_performance` - User's solve data, progress
- `training_advice` - Training plans, improvement tips
- `cubing_knowledge` - Algorithms, methods, tutorials
- `product_review` - Cube reviews, recommendations
- `cubing_news` - Latest news, discussions, updates
- `general_chat` - Casual conversation

### 2. CubeDev Agent (`app/agents/cubedev_agent.py`)

**Purpose**: Personal speedcubing coach analyzing user's solve data from CubeDev platform.

**Capabilities**:

- Analyze solve performance (averages, consistency, trends)
- Phase split analysis (Cross, F2L, OLL, PLL)
- Identify weaknesses and strengths
- Generate personalized training plans
- Track progress over time
- Compare with personal bests

**Tools**:

- `get_user_solve_data` - Fetch solves from Convex
- `analyze_solve_performance` - Statistical analysis
- `analyze_phase_splits` - CFOP phase breakdown
- `generate_training_plan` - Personalized recommendations
- `track_progress_over_time` - Historical tracking

### 3. WCA Agent (`app/agents/wca_agent.py`)

**Purpose**: Access official WCA competition data and rankings.

**Capabilities**:

- Competition information and schedules
- Competitor profiles and stats
- Event rankings (world/regional)
- World records and achievements
- Competition results
- Practice scramble generation

**Tools**:

- `get_competition_info` - Competition details
- `get_user_profile` - Competitor profiles
- `get_rankings_by_event` - Event rankings
- `get_world_records` - Records by event
- `search_competitors` - Find competitors
- `get_scramble` - Generate practice scrambles

### 4. Web Search Agent (`app/agents/web_search_agent.py`)

**Purpose**: Find curated speedcubing information from trusted web sources.

**Capabilities**:

- Search trusted cubing websites
- Find tutorials and learning resources
- Discover algorithm resources
- Provide cube reviews and recommendations
- Share competition tips
- Track cubing news and trends

**Trusted Sources**:

- World Cube Association
- CubeSkills, JPerm.net
- SpeedSolving.com, r/Cubers
- SpeedCubeReview, The Cubicle
- CubeDev platform

**Tools**:

- `search_cubing_web` - General cubing search
- `search_cubing_tutorials` - Tutorial resources
- `search_algorithm_resources` - Algorithm sheets
- `search_cube_reviews` - Product reviews
- `search_competition_tips` - Competition advice
- `search_cubing_news` - Latest updates
- `search_method_comparison` - Method comparisons

### 5. RAG Knowledge Base (`app/rag/knowledge_base.py`)

**Purpose**: Semantic retrieval from CubeDev's curated knowledge base.

**Features**:

- MongoDB Atlas Vector Search
- Google Generative AI embeddings
- MMR (Maximum Marginal Relevance) for diversity
- Category-based filtering
- Difficulty-level filtering

**Knowledge Categories**:

- `algorithms` - Algorithm sheets and explanations
- `tutorials` - Step-by-step guides
- `methods` - Solving method documentation
- `tips` - Training and competition tips
- `faq` - Frequently asked questions

### 6. Conversation Memory (`app/memory/conversation_memory.py`)

**Purpose**: Manage conversation context with MongoDB persistence.

**Memory Strategies**:

- **Buffer Memory**: Full conversation history (short conversations)
- **Window Memory**: Last N messages (medium conversations)
- **Summary Memory**: Summarized history + recent messages (long conversations)

**Features**:

- Automatic strategy selection based on conversation length
- MongoDB persistence via ChatService
- Efficient context loading
- Conversation summarization using LLM

### 7. Chat Service (`app/db/chat_service.py`)

**Purpose**: Database operations for chat sessions and messages.

**Operations**:

**Sessions**:

- Create, read, update, delete sessions
- Get user's sessions
- Auto-generate session titles
- Session statistics

**Messages**:

- Create messages (user/bot)
- Get session messages
- Update message feedback
- Search messages

**Features**:

- Indexed queries for performance
- Message metadata support
- Tool usage tracking
- Source citations

### 8. Orchestrator (`app/orchestrator/cubie_orchestrator.py`)

**Purpose**: Coordinate the complete query processing flow.

**Query Processing Flow**:

1. **User Message Saved** → Save to database
2. **Load Context** → Retrieve conversation history
3. **RAG Retrieval** → Get relevant knowledge base context
4. **Routing** → Classify query and select agents
5. **Agent Execution** → Execute specialized agents in parallel
6. **Synthesis** → Combine responses coherently
7. **Response Generation** → Generate final answer with LLM
8. **Save Response** → Store with metadata

**Metadata Tracking**:

- Tools used by each agent
- Sources and citations
- Processing time per step
- Confidence scores
- Token counts

## API Endpoints

### Authentication

All endpoints (except `/` and `/health`) require JWT authentication via Convex.

**Header**: `Authorization: Bearer <JWT_TOKEN>`

### Core Endpoints

#### `POST /chat`

Send a message and get AI response.

**Request**:

```json
{
  "message": "How can I improve my F2L speed?",
  "session_id": "optional_session_id",
  "use_rag": true,
  "stream": false
}
```

**Response**:

```json
{
  "status": "success",
  "response": "To improve your F2L speed...",
  "session_id": "507f1f77bcf86cd799439011",
  "message_id": "507f1f77bcf86cd799439012",
  "metadata": {
    "tools_used": [...],
    "sources": [...],
    "total_processing_time_ms": 1250.5
  },
  "routing": {
    "primary_category": "training_advice",
    "agents_called": ["cubedev_agent", "web_search_agent"],
    "confidence": 0.95
  },
  "processing_time_ms": 1250.5,
  "timestamp": "2024-11-04T12:00:00Z"
}
```

#### `POST /chat/session`

Create new chat session.

#### `GET /chat/sessions`

Get user's chat sessions.

#### `GET /chat/session/{session_id}`

Get session history with messages.

#### `DELETE /chat/session/{session_id}`

Delete a session.

#### `POST /chat/feedback`

Submit feedback on a message.

#### `GET /health`

Health check endpoint.

## Data Models

### ChatSession

```python
{
  "id": ObjectId,
  "user_id": str,
  "title": str,
  "created_at": datetime,
  "updated_at": datetime
}
```

### Message

```python
{
  "id": ObjectId,
  "chat_session_id": ObjectId,
  "user_id": str,
  "role": "user" | "bot",
  "content": str,
  "metadata": {
    "tools_used": [...],
    "sources": [...],
    "confidence_score": float,
    "processing_time_ms": float
  },
  "feedback": {
    "feedback_type": "like" | "dislike",
    "comment": str
  },
  "created_at": datetime
}
```

## Environment Configuration

See `.env.example` for all configuration options.

**Required Variables**:

- `MONGODB_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `CONVEX_URL` - Convex deployment URL
- `TAVILY_API_KEY` - Tavily search API key

## Installation & Setup

### 1. Install Dependencies

```bash
cd cubie_backend
pip install -e .
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. MongoDB Setup

Create MongoDB Atlas cluster with Vector Search enabled.

Create index on `knowledge_base` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.category"
    },
    {
      "type": "filter",
      "path": "metadata.difficulty"
    }
  ]
}
```

### 4. Run Server

```bash
python main.py
# or
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Integration

### 1. Authentication

Obtain Convex JWT token from frontend authentication flow.

### 2. Create Session

```typescript
const response = await fetch("http://localhost:8000/chat/session", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${convexToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "My Training Session",
  }),
});
const { session_id } = await response.json();
```

### 3. Send Message

```typescript
const response = await fetch("http://localhost:8000/chat", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${convexToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: userQuery,
    session_id: sessionId,
    use_rag: true,
  }),
});
const data = await response.json();
console.log(data.response); // AI response
```

### 4. Get History

```typescript
const response = await fetch(
  `http://localhost:8000/chat/session/${sessionId}`,
  {
    headers: {
      Authorization: `Bearer ${convexToken}`,
    },
  }
);
const { session, messages } = await response.json();
```

## Performance Optimization

### 1. Caching

- JWKS caching for auth validation
- Knowledge base retrieval caching (Redis optional)
- LRU cache for frequent queries

### 2. Parallel Execution

- Multiple agents execute in parallel
- Async/await throughout the stack
- Connection pooling for database

### 3. Rate Limiting

- Per-user rate limits (60/minute by default)
- Protects against abuse
- Configurable limits

### 4. Database Optimization

- Indexed queries on frequently accessed fields
- Aggregation pipelines for complex queries
- Connection pooling

## Monitoring & Debugging

### LangSmith Integration

Enable LangChain tracing:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_key
LANGSMITH_PROJECT=cubie-ai
```

### Logging

Set log level in `.env`:

```bash
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
LOG_REQUESTS=true
```

### Error Tracking

Integrate Sentry (optional):

```bash
SENTRY_DSN=your_sentry_dsn
```

## Testing

### Unit Tests

```bash
pytest tests/unit
```

### Integration Tests

```bash
pytest tests/integration
```

### E2E Tests

```bash
pytest tests/e2e
```

## Deployment

### Docker

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -e .
CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Checklist

- [ ] Set `DEBUG=false`
- [ ] Set `SKIP_AUTH_VALIDATION=false`
- [ ] Configure proper CORS origins
- [ ] Set strong JWT secret
- [ ] Enable rate limiting
- [ ] Configure MongoDB connection pooling
- [ ] Set up monitoring (LangSmith, Sentry)
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL/TLS
- [ ] Environment variable management (secrets)
- [ ] Backup strategy for MongoDB

## Security Considerations

1. **Authentication**: JWT validation via Convex
2. **Rate Limiting**: Per-user limits
3. **Input Validation**: Pydantic schemas
4. **CORS**: Restricted origins
5. **SQL Injection**: MongoDB parameterized queries
6. **XSS**: Output sanitization in frontend
7. **API Key Security**: Environment variables, never committed

## Future Enhancements

1. **Streaming Responses**: Real-time token streaming
2. **Voice Input**: Audio transcription support
3. **Image Analysis**: Cube state recognition
4. **Multi-language**: i18n support
5. **Advanced Analytics**: User insights dashboard
6. **Collaborative Sessions**: Multi-user chat rooms
7. **Custom Agents**: User-defined agent behaviors
8. **Plugin System**: Extensible agent architecture

## Support & Resources

- **Documentation**: `/docs` (FastAPI auto-docs)
- **GitHub**: [CubeDev Repository]
- **Discord**: [CubeDev Community]
- **Email**: support@cubedev.xyz

## License

Copyright © 2024 CubeDev. All rights reserved.
