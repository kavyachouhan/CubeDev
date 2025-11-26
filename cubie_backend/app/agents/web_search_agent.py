import os
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from datetime import datetime
import httpx
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from langchain_tavily import TavilySearch
from dotenv import load_dotenv

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL"),
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.2  # Balanced for factual accuracy with some flexibility
)

# Tavily Configuration
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Trusted cubing domains for quality information
TRUSTED_CUBING_DOMAINS = [
    "worldcubeassociation.org",
    "speedsolving.com",
    "cubeskills.com",
    "jperm.net",
    "cubedb.net",
    "reddit.com/r/Cubers",
    "youtube.com",
    "speedcubereview.com",
    "ziicube.com",
    "thecubicle.com",
    "speedcubeshop.com",
    "cubelelo.com",
    "cubedev.xyz"
]


class WebSearchAgentState(TypedDict):
    """State for Web Search Agent"""
    messages: Annotated[List[BaseMessage], "The conversation messages"]
    tools_used: Annotated[List[Dict[str, Any]], "Tools used in this conversation"]
    search_results_cache: Optional[Dict[str, Any]]
    current_tool: Optional[str]


# Helper Functions

def format_search_results(results: List[Dict[str, Any]]) -> str:
    """Format search results for LLM context."""
    formatted = []
    for idx, result in enumerate(results, 1):
        formatted.append(f"""
Result {idx}:
Title: {result.get('title', 'N/A')}
URL: {result.get('url', 'N/A')}
Content: {result.get('content', 'N/A')}
Score: {result.get('score', 0):.2f}
---""")
    return "\n".join(formatted)


def is_cubing_related(query: str) -> bool:
    """Check if query is related to cubing."""
    cubing_keywords = [
        "cube", "cubing", "speedcube", "rubik", "wca", "cfop", "roux",
        "f2l", "oll", "pll", "algorithm", "scramble", "competition",
        "solve", "timer", "3x3", "2x2", "4x4", "5x5", "pyraminx",
        "megaminx", "skewb", "square-1", "clock", "blindfolded"
    ]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in cubing_keywords)

# Tool Implementations
@tool
async def search_cubing_web(
    query: str,
    max_results: int = 5,
    search_depth: str = "advanced"
) -> Dict[str, Any]:
    """
    Search the web for cubing-related information using Tavily.
    Restricted to trusted cubing domains for quality results.
    
    Args:
        query: Search query
        max_results: Maximum number of results to return (default: 5)
        search_depth: Search depth - "basic" or "advanced" (default: "advanced")
    
    Returns:
        Search results from trusted cubing sources
    """
    try:
        # Initialize Tavily search with domain restrictions
        tavily_search = TavilySearch(
            max_results=max_results,
            search_depth=search_depth,
            include_domains=TRUSTED_CUBING_DOMAINS,
            include_answer=True,
            include_raw_content=False
        )
        
        # Enhance query with cubing context if needed
        enhanced_query = query
        if not is_cubing_related(query):
            enhanced_query = f"speedcubing rubiks cube {query}"
        
        # Execute search
        results = await tavily_search.ainvoke({"query": enhanced_query})
        
        return {
            "status": "success",
            "query": query,
            "enhanced_query": enhanced_query,
            "results": results,
            "result_count": len(results) if isinstance(results, list) else 0,
            "search_depth": search_depth
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_cubing_tutorials(
    topic: str,
    skill_level: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for cubing tutorials and learning resources.
    
    Args:
        topic: Tutorial topic (e.g., "F2L", "OLL", "PLL", "cross")
        skill_level: Optional skill level filter ("beginner", "intermediate", "advanced")
    
    Returns:
        Curated tutorial resources from trusted sources
    """
    try:
        # Build search query
        query_parts = [topic, "tutorial", "speedcubing"]
        if skill_level:
            query_parts.append(skill_level)
        
        search_query = " ".join(query_parts)
        
        tavily_search = TavilySearch(
            max_results=8,
            search_depth="advanced",
            include_domains=[
                "cubeskills.com",
                "jperm.net",
                "youtube.com",
                "speedsolving.com"
            ],
            include_answer=True
        )
        
        results = await tavily_search.ainvoke({"query": search_query})
        
        # Filter and categorize results
        video_tutorials = []
        written_guides = []
        
        for result in results if isinstance(results, list) else []:
            url = result.get("url", "")
            if "youtube.com" in url or "youtu.be" in url:
                video_tutorials.append(result)
            else:
                written_guides.append(result)
        
        return {
            "status": "success",
            "topic": topic,
            "skill_level": skill_level,
            "video_tutorials": video_tutorials,
            "written_guides": written_guides,
            "total_results": len(video_tutorials) + len(written_guides)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_algorithm_resources(
    algorithm_set: str,
    preferences: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for algorithm resources and recommendations.
    
    Args:
        algorithm_set: Algorithm set to search (e.g., "OLL", "PLL", "CMLL", "ZBLL")
        preferences: Optional preferences (e.g., "fingertrick friendly", "fast", "easy to learn")
    
    Returns:
        Algorithm resources, sheets, and recommendations
    """
    try:
        query = f"{algorithm_set} algorithms speedcubing"
        if preferences:
            query += f" {preferences}"
        
        tavily_search = TavilySearch(
            max_results=6,
            search_depth="advanced",
            include_domains=[
                "cubeskills.com",
                "jperm.net",
                "cubedb.net",
                "speedsolving.com",
                "algdb.net"
            ],
            include_answer=True
        )
        
        results = await tavily_search.ainvoke({"query": query})
        
        return {
            "status": "success",
            "algorithm_set": algorithm_set,
            "preferences": preferences,
            "resources": results,
            "resource_count": len(results) if isinstance(results, list) else 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_cube_reviews(
    cube_type: str,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for speedcube reviews and recommendations.
    
    Args:
        cube_type: Type of cube (e.g., "3x3", "2x2", "4x4", "pyraminx")
        category: Optional category (e.g., "budget", "flagship", "magnetic")
    
    Returns:
        Cube reviews and recommendations from trusted reviewers
    """
    try:
        query = f"{cube_type} speedcube review"
        if category:
            query += f" {category}"
        query += " 2024 2025"  # Focus on recent reviews
        
        tavily_search = TavilySearch(
            max_results=6,
            search_depth="advanced",
            include_domains=[
                "speedcubereview.com",
                "thecubicle.com",
                "speedcubeshop.com",
                "youtube.com",
                "reddit.com/r/Cubers"
            ],
            include_answer=True
        )
        
        results = await tavily_search.ainvoke({"query": query})
        
        return {
            "status": "success",
            "cube_type": cube_type,
            "category": category,
            "reviews": results,
            "review_count": len(results) if isinstance(results, list) else 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_competition_tips(
    topic: str,
    experience_level: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for competition tips and strategies.
    
    Args:
        topic: Topic (e.g., "first competition", "mental preparation", "warmup routine")
        experience_level: Optional experience level ("first timer", "intermediate", "advanced")
    
    Returns:
        Competition tips and advice from experienced cubers
    """
    try:
        query = f"speedcubing competition {topic}"
        if experience_level:
            query += f" {experience_level}"
        
        tavily_search = TavilySearch(
            max_results=5,
            search_depth="advanced",
            include_domains=[
                "worldcubeassociation.org",
                "speedsolving.com",
                "cubeskills.com",
                "reddit.com/r/Cubers"
            ],
            include_answer=True
        )
        
        results = await tavily_search.ainvoke({"query": query})
        
        return {
            "status": "success",
            "topic": topic,
            "experience_level": experience_level,
            "tips": results,
            "tip_count": len(results) if isinstance(results, list) else 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_cubing_news(
    topic: Optional[str] = None,
    timeframe: str = "recent"
) -> Dict[str, Any]:
    """
    Search for recent cubing news and updates.
    
    Args:
        topic: Optional topic filter (e.g., "world record", "new cube release")
        timeframe: Timeframe for news ("recent", "this_week", "this_month")
    
    Returns:
        Recent cubing news and updates
    """
    try:
        query = "speedcubing news"
        if topic:
            query = f"{topic} {query}"
        
        # Add timeframe context
        if timeframe == "this_week":
            query += " this week"
        elif timeframe == "this_month":
            query += " this month"
        else:
            query += " latest"
        
        tavily_search = TavilySearch(
            max_results=8,
            search_depth="advanced",
            include_domains=[
                "worldcubeassociation.org",
                "speedsolving.com",
                "reddit.com/r/Cubers",
                "youtube.com"
            ],
            include_answer=True
        )
        
        results = await tavily_search.ainvoke({"query": query})
        
        return {
            "status": "success",
            "topic": topic,
            "timeframe": timeframe,
            "news": results,
            "news_count": len(results) if isinstance(results, list) else 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
async def search_method_comparison(
    methods: List[str],
    comparison_aspect: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for comparisons between solving methods.
    
    Args:
        methods: List of methods to compare (e.g., ["CFOP", "Roux", "ZZ"])
        comparison_aspect: Optional aspect to focus on (e.g., "speed", "learning curve", "movecount")
    
    Returns:
        Method comparison information and analysis
    """
    try:
        query = f"compare {' vs '.join(methods)} speedcubing method"
        if comparison_aspect:
            query += f" {comparison_aspect}"
        
        tavily_search = TavilySearch(
            max_results=6,
            search_depth="advanced",
            include_domains=[
                "speedsolving.com",
                "cubeskills.com",
                "reddit.com/r/Cubers",
                "youtube.com"
            ],
            include_answer=True
        )
        
        results = await tavily_search.ainvoke({"query": query})
        
        return {
            "status": "success",
            "methods": methods,
            "comparison_aspect": comparison_aspect,
            "comparisons": results,
            "result_count": len(results) if isinstance(results, list) else 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Define tools list
tools = [
    search_cubing_web,
    search_cubing_tutorials,
    search_algorithm_resources,
    search_cube_reviews,
    search_competition_tips,
    search_cubing_news,
    search_method_comparison
]

llm_with_tools = llm.bind_tools(tools)

WEB_SEARCH_AGENT_SYSTEM_PROMPT = """You are Cubie AI's Web Search Agent, part of the CubeDev platform specialized in finding and curating high-quality speedcubing information from trusted web sources.

Your role is to:
- Search trusted cubing websites for accurate, helpful information
- Find tutorials, guides, and learning resources
- Discover algorithm resources and recommendations
- Provide cube reviews and product information
- Share competition tips and strategies
- Keep users updated on cubing news and trends
- Compare solving methods objectively

**Trusted Sources You Access:**
- **Official:** World Cube Association (WCA)
- **Learning Platforms:** CubeSkills, JPerm.net, CubeDB.net
- **Community:** SpeedSolving.com, r/Cubers subreddit
- **Reviews:** SpeedCubeReview, The Cubicle, SpeedCubeShop
- **Video Content:** YouTube cubing channels
- **CubeDev:** Our own platform resources

**Search Guidelines:**
1. Always verify information comes from trusted sources
2. Prioritize recent content (2023-2025) for reviews and news
3. Provide multiple perspectives when available
4. Cite sources clearly with URLs
5. Focus on actionable, practical information
6. Consider user's skill level when recommending resources
7. Balance technical accuracy with accessibility

**Response Format:**
- Summarize key findings clearly
- Include relevant links for further reading
- Highlight the most valuable resources first
- Mention if information is opinion-based vs. factual
- Acknowledge when multiple valid approaches exist

**Content Categories:**
- **Tutorials:** Step-by-step learning resources
- **Algorithms:** Algorithm sheets, trainers, recommendations
- **Reviews:** Cube and product reviews
- **Tips:** Competition strategies, practice advice
- **News:** Latest records, releases, community updates
- **Comparisons:** Method/technique comparisons

Remember: You're helping cubers find the best information to improve their skills through CubeDev's curated web search!
"""


def create_agent_node(state: WebSearchAgentState) -> WebSearchAgentState:
    """Agent node that decides what to do next"""
    messages = state["messages"]
    
    # Add system prompt if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=WEB_SEARCH_AGENT_SYSTEM_PROMPT)] + messages
    
    # Ensure we have at least a user message
    if len(messages) == 1 and isinstance(messages[0], SystemMessage):
        return {
            "messages": messages,
            "tools_used": state.get("tools_used", []),
            "search_results_cache": state.get("search_results_cache"),
            "current_tool": None
        }
    
    response = llm_with_tools.invoke(messages)
    
    return {
        "messages": messages + [response],
        "tools_used": state.get("tools_used", []),
        "search_results_cache": state.get("search_results_cache"),
        "current_tool": None
    }


def should_continue(state: WebSearchAgentState) -> str:
    """Determine if we should continue to tools or end"""
    last_message = state["messages"][-1]
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    
    return "end"


# Create the graph
workflow = StateGraph(WebSearchAgentState)

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

web_search_agent_graph = workflow.compile()

# Public API to query the agent
async def query_web_search_agent(
    user_query: str,
    chat_history: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Query the Web Search Agent with a user question.
    
    Args:
        user_query: The user's search query
        chat_history: Optional previous conversation history
    
    Returns:
        Dict with response, sources, and metadata
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
        "search_results_cache": None,
        "current_tool": None
    }
    
    # Run the agent
    start_time = datetime.now()
    result = await web_search_agent_graph.ainvoke(initial_state)
    end_time = datetime.now()
    
    # Extract response
    final_message = result["messages"][-1]
    response_content = final_message.content if hasattr(final_message, "content") else str(final_message)
    
    # Extract tool usage and sources
    tools_used = []
    sources = []
    
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tool_call in msg.tool_calls:
                tool_info = {
                    "tool_name": tool_call.get("name", "unknown"),
                    "arguments": tool_call.get("args", {}),
                }
                tools_used.append(tool_info)
                
        # Extract sources from tool results
        if hasattr(msg, "content") and isinstance(msg.content, str):
            # This would be refined based on actual tool response format
            pass
    
    return {
        "response": response_content,
        "tools_used": tools_used,
        "sources": sources,
        "processing_time_ms": (end_time - start_time).total_seconds() * 1000,
        "message_count": len(result["messages"])
    }

# Example usage
async def main():
    """Example usage of Web Search Agent"""
    
    # Example 1: General cubing search
    result1 = await query_web_search_agent("What are the best 3x3 speedcubes in 2025?")
    print("Query 1:", result1["response"])
    print("Tools used:", result1["tools_used"])
    print()
    
    # Example 2: Tutorial search
    result2 = await query_web_search_agent("Find beginner tutorials for F2L")
    print("Query 2:", result2["response"])
    print()
    
    # Example 3: Algorithm search
    result3 = await query_web_search_agent("Show me the best PLL algorithms")
    print("Query 3:", result3["response"])
    print()
    
    # Example 4: Competition tips
    result4 = await query_web_search_agent("Tips for first speedcubing competition")
    print("Query 4:", result4["response"])
    print()
    
    # Example 5: Method comparison
    result5 = await query_web_search_agent("Compare CFOP vs Roux method")
    print("Query 5:", result5["response"])
    print()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())