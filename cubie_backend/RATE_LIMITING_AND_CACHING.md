# Rate Limiting and Caching Implementation

## Overview

This document describes the rate limiting and caching implementation in Cubie AI backend to reduce server load and improve performance.

## Rate Limiting with SlowAPI

### Configuration

- **Library**: SlowAPI (already installed)
- **Strategy**: IP-based rate limiting per endpoint
- **Additional**: User-level rate limiting in auth middleware

### Endpoint Rate Limits

| Endpoint                      | Rate Limit | Reason                                            |
| ----------------------------- | ---------- | ------------------------------------------------- |
| `/` (Root)                    | 20/minute  | Low priority, informational                       |
| `/health`                     | 30/minute  | Health checks should be relatively frequent       |
| `/chat`                       | 10/minute  | Primary endpoint - balanced with user-level limit |
| `/chat/session` (POST)        | 20/minute  | Session creation                                  |
| `/chat/sessions` (GET)        | 30/minute  | Listing sessions                                  |
| `/chat/session/{id}` (GET)    | 30/minute  | Reading session history                           |
| `/chat/session/{id}` (PUT)    | 20/minute  | Updating sessions                                 |
| `/chat/session/{id}` (DELETE) | 15/minute  | Deleting sessions (lower to prevent abuse)        |
| `/chat/feedback` (POST)       | 30/minute  | User feedback submission                          |

### User-Level Rate Limiting

- **Location**: `app/auth/convex_auth.py`
- **Limit**: 60 requests per minute per user
- **Window**: Rolling 1-minute window
- **Storage**: In-memory (resets on restart)

### Response on Rate Limit Exceeded

- **HTTP Status**: 429 Too Many Requests
- **Response Body**:
  ```json
  {
    "detail": "Rate limit exceeded. Please slow down and try again later.",
    "retry_after": "..."
  }
  ```

## Caching System

### Architecture

- **Location**: `app/utils/cache_manager.py`
- **Type**: In-memory caching with TTL
- **Thread Safety**: Async lock protected

### Cache Components

#### 1. Core Cache Manager (`CacheManager`)

- Generic caching with TTL support
- Automatic expiration
- Thread-safe async operations
- Methods: `get()`, `set()`, `delete()`, `clear()`, `cleanup_expired()`

#### 2. WCA Cache Manager (`WCACacheManager`)

Caches WCA API responses to reduce load on WCA servers:

| Data Type           | TTL        | Cache Key Pattern                  |
| ------------------- | ---------- | ---------------------------------- |
| Competition Info    | 1 hour     | `wca:comp:{competition_id}`        |
| User Profiles       | 30 minutes | `wca:user:{wca_id}`                |
| Competition Results | 1 hour     | `wca:results:{comp_id}:{event_id}` |
| Search Results      | 10 minutes | Dynamic                            |

**Cached Tools**:

- `get_competition_info()` - Specific competition lookups
- `get_user_profile()` - User profile by WCA ID
- `get_competition_results()` - Competition results

**Not Cached**:

- Competition lists with filters (dynamic queries)
- Search queries (vary too much)

#### 3. RAG Cache Manager (`RAGCacheManager`)

Caches knowledge base query results to reduce MongoDB Atlas Vector Search load:

| Data Type           | TTL        | Cache Key Pattern                    |
| ------------------- | ---------- | ------------------------------------ |
| Knowledge Retrieval | 30 minutes | `rag:retrieval:{query_hash}:{top_k}` |

**Benefits**:

- Reduces vector search operations
- Lowers MongoDB Atlas costs
- Faster response times for repeated queries

#### 4. Query Cache Manager (`QueryCacheManager`)

Caches complete query-response pairs for common questions:

| Data Type       | TTL        | Cache Key Pattern               |
| --------------- | ---------- | ------------------------------- |
| Query Responses | 10 minutes | `query:{query_hash}:rag={bool}` |

**Smart Caching**:

- Only caches first messages in sessions (no context dependency)
- Skips caching for follow-up questions
- Includes full response, metadata, and routing info

**Benefits**:

- Saves LLM API calls
- Reduces agent execution overhead
- Instant responses for popular questions

### Cache Statistics

Access cache stats via:

```python
cache_manager = get_cache_manager()
stats = cache_manager.get_stats()
# Returns: {"total_entries": N, "active_entries": M, "expired_entries": K}
```

## Implementation Details

### Integrated Locations

1. **Main Application** (`app/app.py`)
   - SlowAPI limiter initialization
   - Rate limit exception handler
   - Cache manager imports
   - Rate limits on all endpoints

2. **WCA Agent** (`app/agents/wca_agent.py`)
   - WCA cache integration in tools
   - Cache checks before API calls
   - Cache updates after successful API calls

3. **Knowledge Base** (`app/rag/knowledge_base.py`)
   - RAG cache integration
   - Cache checks before vector search
   - Cache updates after retrieval

4. **Orchestrator** (`app/orchestrator/cubie_orchestrator.py`)
   - Query cache integration
   - Smart caching logic for first messages
   - Cache population after successful responses

## Performance Impact

### Expected Improvements

1. **Rate Limiting**:
   - Prevents abuse and server overload
   - Protects against DDoS attacks
   - Fair resource distribution

2. **WCA Caching**:
   - Reduces WCA API calls by ~70-80% for common lookups
   - Faster response times (cache hit: <1ms vs API: 100-500ms)

3. **RAG Caching**:
   - Reduces MongoDB Atlas vector search operations by ~50-60%
   - Lower database costs
   - Faster knowledge retrieval

4. **Query Caching**:
   - Saves LLM API calls for popular questions
   - Reduces agent execution overhead
   - Near-instant responses for cached queries

### Monitoring

Currently in-memory caching with no persistence. To monitor:

- Check cache stats via `get_cache_manager().get_stats()`
- Monitor rate limit 429 responses
- Track processing times with/without cache hits

## Future Enhancements

### Recommended Upgrades

1. **Distributed Caching**:
   - Implement Redis for multi-instance deployments
   - Persistent cache across restarts
   - Shared cache between instances

2. **Cache Warming**:
   - Pre-populate cache with popular queries
   - Background cache refresh for expiring entries

3. **Advanced Rate Limiting**:
   - User tier-based limits (free vs premium)
   - Dynamic rate limits based on server load
   - Redis-based distributed rate limiting

4. **Cache Analytics**:
   - Hit/miss ratios
   - Cache effectiveness metrics
   - Automated cache tuning

5. **Selective Cache Invalidation**:
   - Invalidate competition caches after events
   - Smart TTL based on data freshness requirements

## Configuration

### Environment Variables

No new environment variables required. Uses existing configuration.

### Tuning Cache TTLs

Edit TTL constants in `app/utils/cache_manager.py`:

```python
# WCA Cache TTLs
COMPETITION_INFO_TTL = 3600  # 1 hour
USER_PROFILE_TTL = 1800      # 30 minutes
RESULTS_TTL = 3600           # 1 hour
SEARCH_TTL = 600             # 10 minutes

# RAG Cache TTL
RETRIEVAL_TTL = 1800         # 30 minutes

# Query Cache TTL
RESPONSE_TTL = 600           # 10 minutes
```

### Tuning Rate Limits

Edit rate limit decorators in `app/app.py`:

```python
@app.post("/chat")
@limiter.limit("10/minute")  # Adjust number here
async def send_message(...):
```

Edit user-level limit in `app/auth/convex_auth.py`:

```python
RATE_LIMIT_MAX_REQUESTS = 60  # Requests per minute
RATE_LIMIT_WINDOW = timedelta(minutes=1)
```

## Testing

### Manual Testing

1. Test rate limiting: Make rapid requests until 429 response
2. Test caching: Make same query twice, observe faster 2nd response
3. Check cache stats: Call `get_cache_manager().get_stats()`

### Automated Testing

```bash
# Run from cubie_backend directory
uv run pytest tests/test_cache.py
uv run pytest tests/test_rate_limit.py
```

## Security Considerations

1. **Rate Limiting**:
   - IP-based limiting can be bypassed with proxies
   - User-level limiting provides additional protection
   - Consider adding CAPTCHA for suspected abuse

2. **Cache Poisoning**:
   - Cache keys include query hashes (prevents injection)
   - No user-controlled cache keys
   - Cache data validated before storage

3. **Memory Management**:
   - In-memory cache limited by server RAM
   - Automatic cleanup of expired entries
   - Consider max cache size limits for production

## Maintenance

### Regular Tasks

1. Monitor cache hit rates
2. Review rate limit logs for abuse patterns
3. Adjust TTLs based on usage patterns
4. Clean up expired cache entries (automatic)

### Troubleshooting

**High 429 Error Rate**:

- Check if legitimate users hitting limits
- Consider increasing limits or user tiers
- Investigate potential abuse

**Low Cache Hit Rate**:

- Verify queries are similar enough to match
- Consider longer TTLs
- Check query normalization

**High Memory Usage**:

- Implement cache size limits
- Reduce TTLs
- Consider Redis migration

## Summary

✅ **Implemented**:

- Comprehensive rate limiting on all endpoints
- WCA API response caching
- RAG knowledge base query caching
- Smart query response caching
- Thread-safe async cache operations

✅ **Benefits**:

- Reduced server load
- Lower API costs (WCA, MongoDB, LLM)
- Faster response times
- Protection against abuse
- Better user experience

✅ **Production Ready**:

- All changes backward compatible
- No breaking changes
- No additional dependencies required
- Graceful degradation on cache failures
