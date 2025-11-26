import os
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from datetime import datetime
import httpx
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL"),
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.1
)

# WCA API Configuration
WCA_API_BASE = "https://www.worldcubeassociation.org/api/v0"
UNOFFICIAL_WCA_API_BASE = "https://wcascrap-64e44a2b3e5b.herokuapp.com/api/V1"
WCA_REST_API_BASE = "https://wca-rest-api.robiningelbrecht.be"

class WCAAgentState(TypedDict):
    """State for WCA Agent"""
    messages: Annotated[List[BaseMessage], "The conversation messages"]
    tools_used: Annotated[List[Dict[str, Any]], "Tools used in this conversation"]
    current_tool: Optional[str]


# Tools Definitions
@tool
async def get_competition_info(
    competition_id: Optional[str] = None,
    region: Optional[str] = None,
    next_only: bool = False
) -> Dict[str, Any]:
    """
    Get information about WCA competitions.
    
    Args:
        competition_id: Specific competition ID to fetch
        region: Filter by region (e.g., "Switzerland", "United States")
        next_only: If True, get only the next upcoming competition for the region
    
    Returns:
        Competition information including dates, venue, registration details
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if competition_id:
                # Get specific competition from official API
                response = await client.get(f"{WCA_API_BASE}/competitions/{competition_id}")
                response.raise_for_status()
                return {"status": "success", "data": response.json()}
            else:
                # Get competitions from unofficial API
                params = {}
                if region:
                    params["region"] = region
                if next_only:
                    params["next"] = 1
                
                response = await client.get(
                    f"{UNOFFICIAL_WCA_API_BASE}/comp",
                    params=params
                )
                response.raise_for_status()
                return {"status": "success", "data": response.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def get_user_profile(wca_id: str) -> Dict[str, Any]:
    """
    Get WCA user profile information.
    
    Args:
        wca_id: The WCA ID of the user (e.g., "2022CHOU06")
    
    Returns:
        User profile including competition count, country, gender, events
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Try unofficial API first for quick profile data
            response = await client.get(
                f"{UNOFFICIAL_WCA_API_BASE}/persons",
                params={"wcaid": wca_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                return {"status": "success", "data": data, "source": "unofficial"}
            
            # Fallback to official API
            response = await client.get(f"{WCA_API_BASE}/persons/{wca_id}")
            response.raise_for_status()
            return {"status": "success", "data": response.json(), "source": "official"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def get_competition_results(
    competition_id: str,
    event_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get results from a specific WCA competition.
    
    Args:
        competition_id: The competition ID
        event_id: Optional event filter (e.g., "333", "444", "222")
    
    Returns:
        Competition results with rankings and times
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{WCA_API_BASE}/competitions/{competition_id}/results"
            if event_id:
                url += f"?event_id={event_id}"
            
            response = await client.get(url)
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_competitors(query: str, limit: int = 10) -> Dict[str, Any]:
    """
    Search for WCA competitors by name.
    
    Args:
        query: Name or partial name to search for
        limit: Maximum number of results to return
    
    Returns:
        List of matching competitors with their WCA IDs and basic info
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{WCA_API_BASE}/search/users",
                params={"q": query, "limit": limit}
            )
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def get_rankings_by_event(
    event: str,
    region: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Get world/regional rankings for a specific event.
    
    Args:
        event: Event ID (222, 333, 444, 555, 666, 777, 333bf, 333fm, 333oh, 
               clock, pyram, skewb, sq1, 444bf, 555bf, 333mbf)
        region: Optional region filter (e.g., "Switzerland", "USA", "India")
        gender: Optional gender filter ("male", "female")
        limit: Number of results to return
    
    Returns:
        Rankings with competitor names, times, and positions
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {"event": event}
            if region:
                params["region"] = region
            if gender:
                params["gender"] = gender
            
            response = await client.get(
                f"{UNOFFICIAL_WCA_API_BASE}/results",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            # Limit results
            if isinstance(data, list) and len(data) > limit:
                data = data[:limit]
            
            return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def get_world_records(
    event: Optional[str] = None,
    region: Optional[str] = None,
    gender: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get world records or regional records.
    
    Args:
        event: Optional event filter (222, 333, 444, 555, 666, 777, 333bf, etc.)
        region: Optional region filter for regional records
        gender: Optional gender filter ("male", "female")
    
    Returns:
        Records with holder names, times, and competition locations
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {}
            if event:
                params["event"] = event
            if region:
                params["region"] = region
            if gender:
                params["gender"] = gender
            
            response = await client.get(
                f"{UNOFFICIAL_WCA_API_BASE}/records",
                params=params
            )
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def get_scramble(event: str) -> Dict[str, Any]:
    """
    Generate a scramble for practice.
    
    Args:
        event: Event type (222, 333, 444, 555, 666, 777, clock, pyram, skewb, minx)
    
    Returns:
        A scramble sequence for the specified event
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{UNOFFICIAL_WCA_API_BASE}/scramble",
                params={"event": event}
            )
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def get_competition_schedule(competition_id: str) -> Dict[str, Any]:
    """
    Get the schedule for a specific competition.
    
    Args:
        competition_id: The competition ID
    
    Returns:
        Competition schedule with events and timings
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{WCA_API_BASE}/competitions/{competition_id}/wcif"
            )
            response.raise_for_status()
            wcif_data = response.json()
            
            # Extract schedule information
            schedule = {
                "venues": wcif_data.get("schedule", {}).get("venues", []),
                "number_of_days": wcif_data.get("schedule", {}).get("numberOfDays", 0)
            }
            
            return {"status": "success", "data": schedule}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Agent Implementation

# Bind tools to LLM
tools = [
    get_competition_info,
    get_user_profile,
    get_competition_results,
    search_competitors,
    get_rankings_by_event,
    get_world_records,
    get_scramble,
    get_competition_schedule
]

llm_with_tools = llm.bind_tools(tools)

# System prompt for WCA Agent
WCA_AGENT_SYSTEM_PROMPT = """You are Cubie AI's WCA Agent, part of the CubeDev platform specialized in providing World Cube Association (WCA) competition and ranking information.

You have access to both official WCA API and unofficial WCA data sources to provide comprehensive speedcubing information for cubers of all levels.

Your capabilities include:
- Competition schedules, locations, and registration details
- Competitor profiles and rankings
- Event results and world/regional records
- Live competition data and schedules
- Practice scrambles for training
- WCA statistics and historical data

Guidelines:
1. Always provide accurate, up-to-date WCA information
2. When asked about competitions, include dates, locations, venue details, and registration status
3. For rankings, specify the event, region, and type (single/average)
4. Format times properly (e.g., 8.52 seconds, 1:12.34 for longer solves)
5. Cite data sources when providing statistics
6. Be helpful, conversational, and enthusiastic about speedcubing
7. If data is unavailable, suggest alternative queries or check if the API is accessible
8. Use the appropriate tool for each query to fetch real-time data

Event ID Reference:
- 222: 2x2 Cube
- 333: 3x3 Cube (standard Rubik's Cube)
- 444: 4x4 Cube
- 555: 5x5 Cube
- 666: 6x6 Cube
- 777: 7x7 Cube
- 333bf: 3x3 Blindfolded
- 333fm: 3x3 Fewest Moves
- 333oh: 3x3 One-Handed
- clock: Clock
- minx/pyram/skewb/sq1: Megaminx, Pyraminx, Skewb, Square-1
- 444bf/555bf: 4x4/5x5 Blindfolded
- 333mbf: 3x3 Multi-Blind

Remember: You're helping speedcubers improve and stay informed about the cubing community through CubeDev!
"""


def create_agent_node(state: WCAAgentState) -> WCAAgentState:
    """Agent node that decides what to do next"""
    messages = state["messages"]
    
    # Ensure system prompt is included
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=WCA_AGENT_SYSTEM_PROMPT)] + messages
    
    response = llm_with_tools.invoke(messages)
    
    return {
        "messages": messages + [response],
        "tools_used": state.get("tools_used", []),
        "current_tool": None
    }


def should_continue(state: WCAAgentState) -> str:
    """Determine if we should continue to tools or end"""
    last_message = state["messages"][-1]
    
    # If there are tool calls, continue to tools
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    
    # Otherwise, end
    return "end"


# Create the graph
workflow = StateGraph(WCAAgentState)

# Add nodes
workflow.add_node("agent", create_agent_node)
workflow.add_node("tools", ToolNode(tools))

# Set entry point
workflow.set_entry_point("agent")

# Add edges
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)

workflow.add_edge("tools", "agent")

# Compile the graph
wca_agent_graph = workflow.compile()


# API to query the WCA Agent
async def query_wca_agent(user_query: str, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Query the WCA Agent with a user question.
    
    Args:
        user_query: The user's question about WCA data
        chat_history: Optional previous conversation history
    
    Returns:
        Dict with response and metadata
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
        "tools_used": [],
        "current_tool": None
    }
    
    # Run the agent
    start_time = datetime.now()
    result = await wca_agent_graph.ainvoke(initial_state)
    end_time = datetime.now()
    
    # Extract response
    final_message = result["messages"][-1]
    response_content = final_message.content if hasattr(final_message, "content") else str(final_message)
    
    # Extract tool usage information
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

# Example usage
async def main():
    """Example usage of WCA Agent"""
    
    # Example 1: Get competition info
    result1 = await query_wca_agent("What competitions are coming up in Switzerland?")
    print("Query 1:", result1["response"])
    print("Tools used:", result1["tools_used"])
    print()
    
    # Example 2: Get user profile
    result2 = await query_wca_agent("Tell me about the competitor with WCA ID 2023HETZ02")
    print("Query 2:", result2["response"])
    print()
    
    # Example 3: Get rankings
    result3 = await query_wca_agent("Who are the top 3x3 solvers in the world?")
    print("Query 3:", result3["response"])
    print()
    
    # Example 4: Get world records
    result4 = await query_wca_agent("What's the world record for 4x4?")
    print("Query 4:", result4["response"])
    print()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())