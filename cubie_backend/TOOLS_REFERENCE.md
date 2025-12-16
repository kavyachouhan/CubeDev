# Cubie AI Tools Reference

Quick reference for all available tools across Cubie AI agents.

## 📊 CubeDev Agent Tools (Personal Performance)

### 1. get_user_solve_data

```python
await get_user_solve_data.ainvoke({
    "user_id": "string",        # User's Convex ID
    "event": "333",             # Event type (222, 333, 444, etc.)
    "days": 30,                 # Number of days to fetch
    "session_id": None          # Optional: specific session
})
```

**Returns:** User's solve times, scrambles, penalties, and splits

### 2. analyze_solve_performance

```python
await analyze_solve_performance.ainvoke({
    "solve_data": {...}         # Data from get_user_solve_data
})
```

**Returns:** Statistics, averages (Ao5, Ao12), consistency, trends, penalties

### 3. analyze_phase_splits

```python
await analyze_phase_splits.ainvoke({
    "solve_data": {...}         # Data from get_user_solve_data
})
```

**Returns:** Cross, F2L, OLL, PLL performance breakdown

### 4. compare_with_personal_bests

```python
await compare_with_personal_bests.ainvoke({
    "user_id": "string",        # User's ID
    "current_data": {...},      # Current performance data
    "event": "333"              # Event type
})
```

**Returns:** Comparison with all-time PBs (single, Ao5, Ao12)

### 5. generate_training_plan

```python
await generate_training_plan.ainvoke({
    "performance_analysis": {...},  # From analyze_solve_performance
    "phase_analysis": {...}         # Optional: from analyze_phase_splits
})
```

**Returns:** Personalized training recommendations and drills

### 6. track_progress_over_time

```python
await track_progress_over_time.ainvoke({
    "user_id": "string",        # User's ID
    "event": "333",             # Event type
    "period": "month"           # "week", "month", "3months", "year"
})
```

**Returns:** Historical progress, improvement metrics, chart data

---

## 🏆 WCA Agent Tools (Competition Data)

### 1. get_competition_info

```python
await get_competition_info.ainvoke({
    "competition_id": "WC2023",  # Optional: specific comp ID
    "region": "Switzerland",     # Optional: filter by region
    "next_only": True            # Optional: next upcoming only
})
```

**Returns:** Competition details, dates, venue, registration

### 2. get_user_profile

```python
await get_user_profile.ainvoke({
    "wca_id": "2022CHOU06"      # WCA ID of competitor
})
```

**Returns:** Competitor profile, competition count, country, events

### 3. get_competition_results

```python
await get_competition_results.ainvoke({
    "competition_id": "WC2023",  # Competition ID
    "event_id": "333"            # Optional: filter by event
})
```

**Returns:** Competition results with rankings and times

### 4. search_competitors

```python
await search_competitors.ainvoke({
    "query": "Feliks Zemdegs",   # Name to search
    "limit": 10                  # Max results
})
```

**Returns:** List of matching competitors with WCA IDs

### 5. get_rankings_by_event

```python
await get_rankings_by_event.ainvoke({
    "event": "333",              # Event ID (222, 333, 444, etc.)
    "region": "USA",             # Optional: region filter
    "gender": "female",          # Optional: gender filter
    "limit": 50                  # Number of results
})
```

**Returns:** Rankings with names, times, positions

### 6. get_world_records

```python
await get_world_records.ainvoke({
    "event": "333",              # Optional: event filter
    "region": "Europe",          # Optional: regional records
    "gender": "male"             # Optional: gender filter
})
```

**Returns:** World/regional records with holders and details

### 7. get_scramble

```python
await get_scramble.ainvoke({
    "event": "333"               # Event type
})
```

**Returns:** Practice scramble sequence
**Supported events:** 222, 333, 444, 555, 666, 777, clock, pyram, skewb, minx

### 8. get_competition_schedule

```python
await get_competition_schedule.ainvoke({
    "competition_id": "WC2023"   # Competition ID
})
```

**Returns:** Competition schedule with events and timings (WCIF format)

---

## 🔍 Web Search Agent Tools (Cubing Resources)

### 1. search_cubing_web

```python
await search_cubing_web.ainvoke({
    "query": "F2L techniques",   # Search query
    "max_results": 5,            # Max results (default: 5)
    "search_depth": "advanced"   # "basic" or "advanced"
})
```

**Returns:** Search results from trusted cubing domains

### 2. search_cubing_tutorials

```python
await search_cubing_tutorials.ainvoke({
    "topic": "OLL",              # Tutorial topic
    "skill_level": "intermediate" # Optional: "beginner", "intermediate", "advanced"
})
```

**Returns:** Tutorial resources from CubeSkills, JPerm, etc.

### 3. search_algorithm_resources

```python
await search_algorithm_resources.ainvoke({
    "algorithm_set": "PLL",      # Algorithm set (OLL, PLL, COLL, etc.)
    "format": "pdf"              # Optional: "pdf", "web", "image"
})
```

**Returns:** Algorithm sheets and resources

### 4. search_cube_reviews

```python
await search_cube_reviews.ainvoke({
    "cube_type": "3x3",          # Cube type
    "category": "flagship"       # Optional: "budget", "flagship", "magnetic"
})
```

**Returns:** Cube reviews and recommendations

### 5. search_competition_tips

```python
await search_competition_tips.ainvoke({
    "topic": "first competition", # Topic
    "experience_level": "beginner" # Optional: experience level
})
```

**Returns:** Competition tips from experienced cubers

### 6. search_cubing_news

```python
await search_cubing_news.ainvoke({
    "topic": "world record",     # Optional: specific topic
    "timeframe": "recent"        # "recent", "this_week", "this_month"
})
```

**Returns:** Latest cubing news and updates

### 7. search_method_comparison

```python
await search_method_comparison.ainvoke({
    "methods": ["CFOP", "Roux"], # Methods to compare (list)
    "comparison_aspect": "speed" # Optional: "speed", "learning curve", "movecount"
})
```

**Returns:** Method comparison information

---

## 📋 Common Patterns

### Sequential Tool Usage Example

```python
# 1. Get user's solve data
solve_data = await get_user_solve_data.ainvoke({
    "user_id": user_id,
    "event": "333",
    "days": 30
})

# 2. Analyze performance
performance = await analyze_solve_performance.ainvoke({
    "solve_data": solve_data
})

# 3. Analyze phases (if splits available)
phases = await analyze_phase_splits.ainvoke({
    "solve_data": solve_data
})

# 4. Generate training plan
training_plan = await generate_training_plan.ainvoke({
    "performance_analysis": performance,
    "phase_analysis": phases
})
```

### Error Handling Pattern

```python
result = await tool_name.ainvoke({...})

if result.get("status") == "success":
    data = result.get("data")
    # Process data
elif result.get("status") == "error":
    error_msg = result.get("message")
    # Handle error
```

---

## 🎯 Event IDs Reference

**Standard Events:**

- `222` - 2x2x2 Cube
- `333` - 3x3x3 Cube
- `444` - 4x4x4 Cube
- `555` - 5x5x5 Cube
- `666` - 6x6x6 Cube
- `777` - 7x7x7 Cube

**Other Events:**

- `333bf` - 3x3x3 Blindfolded
- `333fm` - 3x3x3 Fewest Moves
- `333oh` - 3x3x3 One-Handed
- `333mbf` - 3x3x3 Multi-Blind
- `clock` - Clock
- `minx` - Megaminx
- `pyram` - Pyraminx
- `skewb` - Skewb
- `sq1` - Square-1
- `444bf` - 4x4x4 Blindfolded
- `555bf` - 5x5x5 Blindfolded

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Required for all agents
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp

# Required for CubeDev Agent
CONVEX_URL=https://your-deployment.convex.cloud

# Required for Web Search Agent
TAVILY_API_KEY=your_tavily_api_key
```

---

## 📝 Return Value Structure

All tools return a dictionary with:

```python
{
    "status": "success" | "error",
    "message": "Optional error/info message",
    "data": {...},  # Tool-specific data
    # ... other tool-specific fields
}
```

Always check `status` before processing results.

---

**Last Updated:** December 6, 2025
