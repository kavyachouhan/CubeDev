import os
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from datetime import datetime, timedelta
import statistics
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from dotenv import load_dotenv
import httpx

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL"),
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.3  # Slightly higher for more creative coaching advice
)

# Convex Configuration
CONVEX_URL = os.getenv("CONVEX_URL")

class CubeDevAgentState(TypedDict):
    """State for CubeDev Agent"""
    messages: Annotated[List[BaseMessage], "The conversation messages"]
    user_id: Optional[str]
    tools_used: Annotated[List[Dict[str, Any]], "Tools used in this conversation"]
    solve_data_cache: Optional[Dict[str, Any]]


# HELPER FUNCTIONS FOR ANALYSIS

def calculate_statistics(times: List[float]) -> Dict[str, Any]:
    """Calculate statistical measures for solve times."""
    if not times:
        return {}
    
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "std_dev": statistics.stdev(times) if len(times) > 1 else 0,
        "min": min(times),
        "max": max(times),
        "count": len(times)
    }

def calculate_ao5(times: List[float]) -> Optional[float]:
    """Calculate average of 5 (remove best and worst)."""
    if len(times) < 5:
        return None
    
    recent_5 = times[-5:]
    sorted_times = sorted(recent_5)
    return statistics.mean(sorted_times[1:4])

def calculate_ao12(times: List[float]) -> Optional[float]:
    """Calculate average of 12 (remove best and worst)."""
    if len(times) < 12:
        return None
    
    recent_12 = times[-12:]
    sorted_times = sorted(recent_12)
    return statistics.mean(sorted_times[1:11])

def analyze_consistency(times: List[float]) -> Dict[str, Any]:
    """Analyze solve consistency."""
    if len(times) < 5:
        return {"consistency_score": None, "message": "Not enough solves"}
    
    std_dev = statistics.stdev(times)
    mean = statistics.mean(times)
    coefficient_of_variation = (std_dev / mean) * 100 if mean > 0 else 0
    
    # Lower CV = better consistency
    if coefficient_of_variation < 10:
        consistency = "Excellent"
    elif coefficient_of_variation < 15:
        consistency = "Good"
    elif coefficient_of_variation < 20:
        consistency = "Fair"
    else:
        consistency = "Needs Improvement"
    
    return {
        "consistency_score": round(coefficient_of_variation, 2),
        "consistency_rating": consistency,
        "std_dev": round(std_dev, 2),
        "mean": round(mean, 2)
    }

def identify_trend(times: List[float], window: int = 20) -> str:
    """Identify performance trend (improving, declining, stable)."""
    if len(times) < window * 2:
        return "insufficient_data"
    
    recent = statistics.mean(times[-window:])
    older = statistics.mean(times[-window*2:-window])
    
    improvement_pct = ((older - recent) / older) * 100
    
    if improvement_pct > 5:
        return "improving"
    elif improvement_pct < -5:
        return "declining"
    else:
        return "stable"


# TOOL IMPLEMENTATIONS

@tool
async def get_user_solve_data(
    user_id: str,
    event: str = "333",
    days: int = 30,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch user's solve data from CubeDev/Convex.
    
    Args:
        user_id: User's ID in Convex
        event: Event type (default: "333")
        days: Number of days to fetch (default: 30)
        session_id: Optional specific session ID
    
    Returns:
        User solve data including times, scrambles, penalties, splits
    """
    try:
        if not CONVEX_URL:
            return {
                "status": "error",
                "message": "CONVEX_URL environment variable not set"
            }
        
        cutoff_date = datetime.now() - timedelta(days=days)
        cutoff_timestamp = int(cutoff_date.timestamp() * 1000)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch user's sessions
            sessions_response = await client.post(
                f"{CONVEX_URL}/getUserSessions",
                json={"userId": user_id}
            )
            sessions_response.raise_for_status()
            sessions_data = sessions_response.json()
            
            # Filter sessions by event if specified
            sessions = sessions_data if isinstance(sessions_data, list) else []
            if event:
                sessions = [s for s in sessions if s.get("event") == event]
            
            # Fetch solves - either for specific session or all user solves
            if session_id:
                solves_response = await client.post(
                    f"{CONVEX_URL}/getSessionSolves",
                    json={"sessionId": session_id}
                )
            else:
                solves_response = await client.post(
                    f"{CONVEX_URL}/getUserSolves",
                    json={"userId": user_id}
                )
            
            solves_response.raise_for_status()
            all_solves = solves_response.json() if solves_response.status_code == 200 else []
            
            # Filter solves by date and event
            solves = []
            for solve in (all_solves if isinstance(all_solves, list) else []):
                solve_date = solve.get("solveDate", 0)
                solve_event = solve.get("event", "")
                
                # Apply filters
                if solve_date >= cutoff_timestamp:
                    if not event or solve_event == event:
                        solves.append(solve)
            
            # Sort solves by date (newest first)
            solves.sort(key=lambda x: x.get("solveDate", 0), reverse=True)
            
            return {
                "status": "success",
                "user_id": user_id,
                "event": event,
                "days": days,
                "data": {
                    "solves": solves,
                    "sessions": sessions,
                    "total_solves": len(solves),
                    "date_range": {
                        "start": cutoff_date.isoformat(),
                        "end": datetime.now().isoformat()
                    }
                }
            }
    except httpx.HTTPStatusError as e:
        return {
            "status": "error", 
            "message": f"Convex API error: {e.response.status_code} - {e.response.text}"
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to fetch solve data: {str(e)}"}


@tool
async def analyze_solve_performance(solve_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze user's solve performance and provide insights.
    
    Args:
        solve_data: User solve data from get_user_solve_data
    
    Returns:
        Performance analysis including averages, trends, consistency
    """
    try:
        solves = solve_data.get("data", {}).get("solves", [])
        
        if not solves:
            return {
                "status": "error",
                "message": "No solve data available for analysis"
            }
        
        # Extract times (excluding DNFs)
        times = [
            s["finalTime"] for s in solves 
            if s.get("penalty") != "DNF"
        ]
        
        # Calculate key metrics
        stats = calculate_statistics(times)
        ao5 = calculate_ao5(times)
        ao12 = calculate_ao12(times)
        consistency = analyze_consistency(times)
        trend = identify_trend(times)
        
        # Count penalties
        plus_two_count = sum(1 for s in solves if s.get("penalty") == "+2")
        dnf_count = sum(1 for s in solves if s.get("penalty") == "DNF")
        
        return {
            "status": "success",
            "analysis": {
                "statistics": stats,
                "averages": {
                    "ao5": round(ao5, 2) if ao5 else None,
                    "ao12": round(ao12, 2) if ao12 else None
                },
                "consistency": consistency,
                "trend": trend,
                "penalties": {
                    "plus_two": plus_two_count,
                    "dnf": dnf_count,
                    "penalty_rate": round((plus_two_count + dnf_count) / len(solves) * 100, 2)
                },
                "solve_count": len(solves)
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def analyze_phase_splits(solve_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze CFOP phase splits to identify weaknesses.
    
    Args:
        solve_data: User solve data including splits
    
    Returns:
        Analysis of cross, F2L, OLL, PLL performance
    """
    try:
        solves = solve_data.get("data", {}).get("solves", [])
        
        # Filter solves with splits
        solves_with_splits = [s for s in solves if s.get("splits")]
        
        if not solves_with_splits:
            return {
                "status": "error",
                "message": "No split data available. Enable splits tracking in timer settings."
            }
        
        # Aggregate phase times
        phase_times = {
            "cross": [],
            "f2l": [],
            "oll": [],
            "pll": []
        }
        
        for solve in solves_with_splits:
            splits = solve.get("splits", [])
            prev_time = 0
            
            for split in splits:
                phase = split.get("phase", "").lower()
                if phase in phase_times:
                    phase_time = split["time"] - prev_time
                    phase_times[phase].append(phase_time)
                    prev_time = split["time"]
        
        # Calculate average times for each phase
        phase_analysis = {}
        for phase, times in phase_times.items():
            if times:
                phase_analysis[phase] = {
                    "average": round(statistics.mean(times), 2),
                    "best": round(min(times), 2),
                    "worst": round(max(times), 2),
                    "consistency": round(statistics.stdev(times), 2) if len(times) > 1 else 0,
                    "count": len(times)
                }
        
        return {
            "status": "success",
            "phase_analysis": phase_analysis
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def compare_with_personal_bests(
    user_id: str,
    current_data: Dict[str, Any],
    event: str = "333"
) -> Dict[str, Any]:
    """
    Compare current performance with personal bests.
    
    Args:
        user_id: User's ID
        current_data: Current solve data
        event: Event type for comparison
    
    Returns:
        Comparison with PBs and progress tracking
    """
    try:
        if not CONVEX_URL:
            return {"status": "error", "message": "CONVEX_URL not configured"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch all-time solves for PB calculation
            solves_response = await client.post(
                f"{CONVEX_URL}/getUserSolves",
                json={"userId": user_id}
            )
            solves_response.raise_for_status()
            all_solves = solves_response.json() if solves_response.status_code == 200 else []
            
            # Filter by event and valid solves
            event_solves = [
                s for s in (all_solves if isinstance(all_solves, list) else [])
                if s.get("event") == event and s.get("penalty") != "DNF"
            ]
            
            if not event_solves:
                return {
                    "status": "success",
                    "comparison": {
                        "message": "No historical data available for comparison"
                    }
                }
            
            # Calculate all-time PBs
            times = [s["finalTime"] for s in event_solves]
            pb_single = min(times) if times else None
            
            # Calculate best ao5 and ao12 from historical data
            pb_ao5 = None
            pb_ao12 = None
            
            if len(times) >= 5:
                # Calculate rolling ao5
                ao5_values = []
                for i in range(len(times) - 4):
                    window = times[i:i+5]
                    sorted_window = sorted(window)
                    ao5 = statistics.mean(sorted_window[1:4])
                    ao5_values.append(ao5)
                pb_ao5 = min(ao5_values) if ao5_values else None
            
            if len(times) >= 12:
                # Calculate rolling ao12
                ao12_values = []
                for i in range(len(times) - 11):
                    window = times[i:i+12]
                    sorted_window = sorted(window)
                    ao12 = statistics.mean(sorted_window[1:11])
                    ao12_values.append(ao12)
                pb_ao12 = min(ao12_values) if ao12_values else None
            
            # Get current stats
            current_stats = current_data.get("analysis", {}).get("statistics", {})
            current_ao5 = current_data.get("analysis", {}).get("averages", {}).get("ao5")
            current_ao12 = current_data.get("analysis", {}).get("averages", {}).get("ao12")
            
            return {
                "status": "success",
                "comparison": {
                    "single": {
                        "pb": round(pb_single / 1000, 2) if pb_single else None,
                        "current_best": round(current_stats.get("min", 0) / 1000, 2) if current_stats.get("min") else None
                    },
                    "ao5": {
                        "pb": round(pb_ao5 / 1000, 2) if pb_ao5 else None,
                        "current": round(current_ao5 / 1000, 2) if current_ao5 else None
                    },
                    "ao12": {
                        "pb": round(pb_ao12 / 1000, 2) if pb_ao12 else None,
                        "current": round(current_ao12 / 1000, 2) if current_ao12 else None
                    },
                    "total_solves": len(event_solves)
                }
            }
    except httpx.HTTPStatusError as e:
        return {"status": "error", "message": f"Convex API error: {e.response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def generate_training_plan(
    performance_analysis: Dict[str, Any],
    phase_analysis: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate personalized training recommendations.
    
    Args:
        performance_analysis: Performance analysis data
        phase_analysis: Optional phase split analysis
    
    Returns:
        Personalized training plan with drills and focus areas
    """
    try:
        recommendations = []
        
        # Analyze consistency
        consistency = performance_analysis.get("analysis", {}).get("consistency", {})
        consistency_rating = consistency.get("consistency_rating")
        
        if consistency_rating in ["Fair", "Needs Improvement"]:
            recommendations.append({
                "category": "consistency",
                "priority": "high",
                "recommendation": "Focus on consistent solving with metronome practice",
                "drills": [
                    "Solve 50 solves focusing on smooth turning",
                    "Practice look-ahead during F2L",
                    "Use metronome at target pace"
                ]
            })
        
        # Analyze penalties
        penalties = performance_analysis.get("analysis", {}).get("penalties", {})
        penalty_rate = penalties.get("penalty_rate", 0)
        
        if penalty_rate > 10:
            recommendations.append({
                "category": "accuracy",
                "priority": "high",
                "recommendation": "Reduce penalty rate through accuracy drills",
                "drills": [
                    "Slow solves focusing on piece recognition",
                    "Practice fingertricks with precision",
                    "Review common mistake patterns"
                ]
            })
        
        # Analyze phase weaknesses
        if phase_analysis and phase_analysis.get("status") == "success":
            phases = phase_analysis.get("phase_analysis", {})
            
            # Identify slowest phase
            if phases:
                slowest_phase = max(phases.items(), key=lambda x: x[1].get("average", 0))
                recommendations.append({
                    "category": "phase_weakness",
                    "priority": "medium",
                    "recommendation": f"Improve {slowest_phase[0].upper()} execution",
                    "current_average": slowest_phase[1].get("average"),
                    "drills": _get_phase_drills(slowest_phase[0])
                })
        
        # Trend-based recommendations
        trend = performance_analysis.get("analysis", {}).get("trend")
        if trend == "declining":
            recommendations.append({
                "category": "motivation",
                "priority": "medium",
                "recommendation": "Take a break and review fundamentals",
                "drills": [
                    "Rest for 1-2 days",
                    "Watch tutorial videos",
                    "Practice slow solves"
                ]
            })
        
        return {
            "status": "success",
            "training_plan": {
                "recommendations": recommendations,
                "focus_areas": [r["category"] for r in recommendations],
                "estimated_duration": "2-4 weeks"
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def _get_phase_drills(phase: str) -> List[str]:
    """Get specific drills for a phase."""
    drills_map = {
        "cross": [
            "Practice cross-only solves with inspection",
            "Learn color neutrality for cross",
            "Practice cross + first pair"
        ],
        "f2l": [
            "Drill F2L pairs with trainer",
            "Practice look-ahead between pairs",
            "Learn advanced F2L cases"
        ],
        "oll": [
            "Drill OLL recognition",
            "Learn 2-look OLL if not known",
            "Practice OLL fingertricks"
        ],
        "pll": [
            "Drill PLL recognition",
            "Learn 2-look PLL if not known",
            "Practice PLL fingertricks and AUF"
        ]
    }
    return drills_map.get(phase, ["Practice this phase more"])


@tool
async def track_progress_over_time(
    user_id: str,
    event: str = "333",
    period: str = "month"
) -> Dict[str, Any]:
    """
    Track user's progress over specified time period.
    
    Args:
        user_id: User's ID
        event: Event type
        period: Time period ("week", "month", "3months", "year")
    
    Returns:
        Progress tracking with charts data and improvement metrics
    """
    try:
        if not CONVEX_URL:
            return {"status": "error", "message": "CONVEX_URL not configured"}
        
        days_map = {
            "week": 7,
            "month": 30,
            "3months": 90,
            "year": 365
        }
        
        days = days_map.get(period, 30)
        cutoff_date = datetime.now() - timedelta(days=days)
        cutoff_timestamp = int(cutoff_date.timestamp() * 1000)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch user solves
            solves_response = await client.post(
                f"{CONVEX_URL}/getUserSolves",
                json={"userId": user_id}
            )
            solves_response.raise_for_status()
            all_solves = solves_response.json() if solves_response.status_code == 200 else []
            
            # Filter by event and date
            solves = [
                s for s in (all_solves if isinstance(all_solves, list) else [])
                if s.get("event") == event 
                and s.get("solveDate", 0) >= cutoff_timestamp
                and s.get("penalty") != "DNF"
            ]
            
            if len(solves) < 10:
                return {
                    "status": "success",
                    "progress": {
                        "period": period,
                        "message": "Not enough solves for progress tracking (minimum 10 required)"
                    }
                }
            
            # Sort by date
            solves.sort(key=lambda x: x.get("solveDate", 0))
            
            # Split into first half and second half
            midpoint = len(solves) // 2
            first_half = solves[:midpoint]
            second_half = solves[midpoint:]
            
            # Calculate averages for each half
            first_half_times = [s["finalTime"] for s in first_half]
            second_half_times = [s["finalTime"] for s in second_half]
            
            first_avg = statistics.mean(first_half_times)
            second_avg = statistics.mean(second_half_times)
            
            # Calculate improvement
            improvement_ms = first_avg - second_avg
            improvement_pct = (improvement_ms / first_avg) * 100 if first_avg > 0 else 0
            
            # Prepare chart data (weekly buckets)
            chart_data = []
            bucket_size = max(1, len(solves) // 10)  # ~10 data points
            
            for i in range(0, len(solves), bucket_size):
                bucket = solves[i:i+bucket_size]
                bucket_times = [s["finalTime"] for s in bucket]
                
                if bucket_times:
                    chart_data.append({
                        "solve_number": i + bucket_size // 2,
                        "average": round(statistics.mean(bucket_times) / 1000, 2),
                        "best": round(min(bucket_times) / 1000, 2),
                        "count": len(bucket_times)
                    })
            
            return {
                "status": "success",
                "progress": {
                    "period": period,
                    "total_solves": len(solves),
                    "improvement": {
                        "percentage": round(improvement_pct, 2),
                        "time_saved_ms": round(improvement_ms, 0),
                        "first_period_avg": round(first_avg / 1000, 2),
                        "second_period_avg": round(second_avg / 1000, 2),
                        "trend": "improving" if improvement_pct > 0 else "declining" if improvement_pct < -2 else "stable"
                    },
                    "chart_data": chart_data
                }
            }
    except httpx.HTTPStatusError as e:
        return {"status": "error", "message": f"Convex API error: {e.response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# AGENT DEFINITION

tools = [
    get_user_solve_data,
    analyze_solve_performance,
    analyze_phase_splits,
    compare_with_personal_bests,
    generate_training_plan,
    track_progress_over_time
]

llm_with_tools = llm.bind_tools(tools)

CUBEDEV_AGENT_SYSTEM_PROMPT = """You are Cubie, a CubeDev Coach, a specialized AI assistant for speedcubing training and improvement on the CubeDev platform.

Your role is to act as a personal cubing coach that:
- Analyzes user solve data from their CubeDev timer sessions
- Identifies strengths, weaknesses, and patterns
- Provides actionable training recommendations
- Tracks progress over time
- Offers motivation and encouragement

**Your Coaching Philosophy:**
1. Data-driven insights: Use solve statistics to identify improvement areas
2. Personalized approach: Tailor advice to each user's skill level and goals
3. Positive reinforcement: Celebrate improvements and milestones
4. Practical guidance: Provide specific drills and practice routines
5. Holistic development: Address technical skills, consistency, and mental game

**Analysis Focus Areas:**
- **Consistency**: Evaluate solve time variance and predictability
- **Averages**: Track Ao5, Ao12, and session averages
- **Trends**: Identify improving, declining, or stable performance
- **Phase Splits**: Analyze CFOP phases (Cross, F2L, OLL, PLL) if available
- **Penalties**: Monitor +2 and DNF rates
- **Progress**: Compare current performance with personal bests

**Training Recommendations:**
- Suggest specific drills based on weaknesses
- Provide algorithm practice recommendations
- Offer look-ahead and fingertrick exercises
- Recommend session structures and practice routines
- Set achievable short-term and long-term goals

**Communication Style:**
- Be encouraging and supportive like a real coach
- Use speedcubing terminology appropriately
- Provide specific, actionable advice
- Balance technical analysis with motivational coaching
- Format times correctly (e.g., 12.34 seconds, 1:05.67 for longer solves)

**Event Types You Support:**
All WCA events:
- 3x3 (333) - Standard Rubik's Cube
- 2x2 (222), 4x4 (444), 5x5 (555), 6x6 (666), 7x7 (777)
- Pyraminx (pyram)
- Megaminx (minx)
- Skewb (skewb)
- Square-1 (sq1)
- Clock (clock)
- 3x3 One-Handed (333oh)
- 3x3 Blindfolded (333bf)
- 4x4 Blindfolded (444bf)
- 5x5 Blindfolded (555bf)
- 3x3 Fewest Moves (333fm)
- 3x3 Multi-Blind (333mbf)

Remember: You're here to help cubers of all levels improve through CubeDev's tools and your personalized coaching!
"""


def create_agent_node(state: CubeDevAgentState) -> CubeDevAgentState:
    """Agent node that decides what to do next"""
    messages = state["messages"]
    
    # Add system prompt if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=CUBEDEV_AGENT_SYSTEM_PROMPT)] + messages
    
    response = llm_with_tools.invoke(messages)
    
    return {
        "messages": messages + [response],
        "user_id": state.get("user_id"),
        "tools_used": state.get("tools_used", []),
        "solve_data_cache": state.get("solve_data_cache")
    }


def should_continue(state: CubeDevAgentState) -> str:
    """Determine if we should continue to tools or end"""
    last_message = state["messages"][-1]
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    
    return "end"


# Create the graph
workflow = StateGraph(CubeDevAgentState)

workflow.add_node("agent", create_agent_node)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)

workflow.add_edge("tools", "agent")

cubedev_agent_graph = workflow.compile()

# PUBLIC INTERFACE
async def query_cubedev_agent(
    user_query: str,
    user_id: str,
    chat_history: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Query the CubeDev Coach Agent.
    
    Args:
        user_query: User's question or request
        user_id: User's Convex ID for data access
        chat_history: Optional conversation history
    
    Returns:
        Coaching response with analysis and recommendations
    """
    # Convert chat history to messages
    messages = []
    if chat_history:
        for msg in chat_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    
    # Add current query
    messages.append(HumanMessage(content=user_query))
    
    # Initialize state
    initial_state = {
        "messages": messages,
        "user_id": user_id,
        "tools_used": [],
        "solve_data_cache": None
    }
    
    # Run the agent
    start_time = datetime.now()
    result = await cubedev_agent_graph.ainvoke(initial_state)
    end_time = datetime.now()
    
    # Extract response
    final_message = result["messages"][-1]
    response_content = final_message.content if hasattr(final_message, "content") else str(final_message)
    
    # Extract tool usage
    tools_used = []
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tool_call in msg.tool_calls:
                tools_used.append({
                    "tool_name": tool_call.get("name", "unknown"),
                    "arguments": tool_call.get("args", {}),
                })
    
    return {
        "response": response_content,
        "tools_used": tools_used,
        "processing_time_ms": (end_time - start_time).total_seconds() * 1000,
        "message_count": len(result["messages"])
    }

# EXAMPLE USAGE
async def main():
    """Example usage of CubeDev Coach Agent"""
    
    # Mock user ID (would come from auth)
    user_id = "user_123"
    
    # Example 1: General performance check
    result1 = await query_cubedev_agent(
        "How am I doing with my 3x3 solves?",
        user_id=user_id
    )
    print("Query 1:", result1["response"])
    print("Tools used:", result1["tools_used"])
    print()
    
    # Example 2: Specific phase analysis
    result2 = await query_cubedev_agent(
        "I feel like my F2L is slow. Can you analyze my splits?",
        user_id=user_id
    )
    print("Query 2:", result2["response"])
    print()
    
    # Example 3: Training plan request
    result3 = await query_cubedev_agent(
        "What should I practice to improve my consistency?",
        user_id=user_id
    )
    print("Query 3:", result3["response"])
    print()
    
    # Example 4: Progress tracking
    result4 = await query_cubedev_agent(
        "Show me my progress over the last month",
        user_id=user_id
    )
    print("Query 4:", result4["response"])
    print()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())