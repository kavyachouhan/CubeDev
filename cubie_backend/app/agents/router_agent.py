import os
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import specialized agents
from app.agents.wca_agent import query_wca_agent
from app.agents.cubedev_agent import query_cubedev_agent
from app.agents.web_search_agent import query_web_search_agent

load_dotenv()

# Initialize LLM for routing
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL"),
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.1  # Low temperature for consistent routing decisions
)

# Routing Data Models
class AgentType(str, Enum):
    """Available specialized agents"""
    WCA_AGENT = "wca_agent"
    CUBEDEV_AGENT = "cubedev_agent"
    WEB_SEARCH_AGENT = "web_search_agent"
    GENERAL_LLM = "general_llm"


class QueryCategory(str, Enum):
    """Query classification categories"""
    WCA_COMPETITION = "wca_competition"  # Competition info, schedules, registration
    WCA_RANKINGS = "wca_rankings"  # Rankings, records, competitor profiles
    PERSONAL_PERFORMANCE = "personal_performance"  # User's solve data, progress
    TRAINING_ADVICE = "training_advice"  # Training plans, improvement tips
    CUBING_KNOWLEDGE = "cubing_knowledge"  # Algorithms, methods, tutorials
    PRODUCT_REVIEW = "product_review"  # Cube reviews, recommendations
    CUBING_NEWS = "cubing_news"  # Latest news, discussions, updates
    GENERAL_CHAT = "general_chat"  # Casual conversation


class RoutingDecision(BaseModel):
    """Structured output for routing decision"""
    primary_category: QueryCategory = Field(description="Primary category of the query")
    secondary_categories: List[QueryCategory] = Field(
        default_factory=list,
        description="Additional relevant categories"
    )
    agents_to_call: List[AgentType] = Field(
        description="List of agents to invoke for this query"
    )
    requires_user_data: bool = Field(
        default=False,
        description="Whether the query requires access to user's solve data"
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for the routing decision"
    )
    reasoning: str = Field(description="Explanation for the routing decision")


class RouterAgentState(TypedDict):
    """State for Router Agent"""
    messages: Annotated[List[BaseMessage], "The conversation messages"]
    user_id: Optional[str]
    routing_decision: Optional[RoutingDecision]
    agent_responses: Dict[str, Any]
    final_response: Optional[str]
    processing_metadata: Dict[str, Any]


# ROUTER AGENT CLASSIFICATION PROMPT
ROUTER_SYSTEM_PROMPT = """You are Cubie AI's Router Agent, responsible for intelligently classifying user queries and routing them to the appropriate specialized agents.

**Available Specialized Agents:**

1. **WCA Agent** - Handles WCA official data:
   - Competition schedules, locations, registration
   - Competitor profiles and WCA IDs
   - Official rankings and records
   - Competition results
   - WCA statistics

2. **CubeDev Agent** - Handles personal training data:
   - User's solve times and sessions
   - Performance analysis (Ao5, Ao12, trends)
   - Phase split analysis (Cross, F2L, OLL, PLL)
   - Training recommendations
   - Progress tracking
   - Personal best comparisons

3. **Web Search Agent** - Handles general cubing information:
   - Tutorials and learning resources
   - Algorithm resources
   - Cube reviews and recommendations
   - Cubing news and discussions
   - Method comparisons
   - Community content

4. **General LLM** - Handles casual conversation:
   - Greetings and small talk
   - Simple cubing questions with known answers
   - General knowledge

**Routing Guidelines:**

1. **WCA Competition/Rankings Queries:**
   - Questions about specific competitions → WCA Agent
   - Questions about rankings, records → WCA Agent
   - Questions about competitors → WCA Agent

2. **Personal Performance Queries:**
   - "How am I doing?", "My averages", "My progress" → CubeDev Agent
   - Performance analysis requests → CubeDev Agent
   - Training plan requests → CubeDev Agent + Web Search Agent

3. **Learning/Knowledge Queries:**
   - "How do I solve...", "Best algorithms for..." → Web Search Agent
   - Tutorial requests → Web Search Agent
   - Method comparisons → Web Search Agent

4. **Product/Review Queries:**
   - Cube recommendations → Web Search Agent
   - Reviews → Web Search Agent

5. **News Queries:**
   - Latest cubing news → Web Search Agent
   - Recent records → WCA Agent

6. **Multi-Agent Queries:**
   - Some queries may benefit from multiple agents
   - Example: "Compare my times to world records" → CubeDev Agent + WCA Agent
   - Example: "I want to improve my F2L, what should I practice?" → CubeDev Agent + Web Search Agent

**Output Requirements:**
- Classify the query into primary and secondary categories
- Determine which agent(s) to call
- Indicate if user data access is required
- Provide reasoning for your decision
- Assign a confidence score

Be precise and efficient in routing to provide users with the best possible responses.
"""


async def classify_query(query: str, user_id: Optional[str] = None) -> RoutingDecision:
    """
    Classify a user query and determine routing.
    
    Args:
        query: User's query string
        user_id: Optional user ID for context
    
    Returns:
        RoutingDecision with classification and routing information
    """
    # Create structured output schema
    structured_llm = llm.with_structured_output(RoutingDecision)
    
    # Build prompt with context
    context = f"User Query: {query}\n"
    if user_id:
        context += f"User ID: {user_id} (authenticated)\n"
    else:
        context += "User: Anonymous/Not authenticated\n"
    
    prompt = f"""{ROUTER_SYSTEM_PROMPT}

{context}

Analyze this query and provide a routing decision. Consider:
1. What information is being requested?
2. Which agent(s) can best answer this?
3. Does this require user-specific data?
4. How confident are you in this routing?

Provide your decision in the structured format."""

    messages = [
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=context)
    ]
    
    try:
        decision = structured_llm.invoke(messages)
        return decision
    except Exception as e:
        # Fallback to general LLM on error
        return RoutingDecision(
            primary_category=QueryCategory.GENERAL_CHAT,
            agents_to_call=[AgentType.GENERAL_LLM],
            requires_user_data=False,
            confidence=0.5,
            reasoning=f"Classification failed, defaulting to general LLM: {str(e)}"
        )

# Agent Execution Logic
async def execute_agents(
    query: str,
    routing_decision: RoutingDecision,
    user_id: Optional[str] = None,
    chat_history: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Execute the appropriate agent(s) based on routing decision.
    
    Args:
        query: User's query
        routing_decision: Routing decision from classifier
        user_id: Optional user ID
        chat_history: Chat history
    
    Returns:
        Dict with responses from each agent
    """
    responses = {}
    errors = {}
    
    for agent_type in routing_decision.agents_to_call:
        try:
            if agent_type == AgentType.WCA_AGENT:
                result = await query_wca_agent(query, chat_history)
                responses["wca_agent"] = result
                
            elif agent_type == AgentType.CUBEDEV_AGENT:
                if not user_id:
                    errors["cubedev_agent"] = "User authentication required for personal data access"
                    continue
                result = await query_cubedev_agent(query, user_id, chat_history)
                responses["cubedev_agent"] = result
                
            elif agent_type == AgentType.WEB_SEARCH_AGENT:
                result = await query_web_search_agent(query, chat_history)
                responses["web_search_agent"] = result
                
            elif agent_type == AgentType.GENERAL_LLM:
                # Direct LLM response for simple queries
                messages = [HumanMessage(content=query)]
                if chat_history:
                    for msg in chat_history:
                        if msg["role"] == "user":
                            messages.insert(-1, HumanMessage(content=msg["content"]))
                        elif msg["role"] == "assistant":
                            messages.insert(-1, AIMessage(content=msg["content"]))
                
                result = llm.invoke(messages)
                responses["general_llm"] = {
                    "response": result.content,
                    "tools_used": [],
                    "processing_time_ms": 0
                }
                
        except Exception as e:
            errors[agent_type.value] = str(e)
    
    return {
        "responses": responses,
        "errors": errors
    }


def synthesize_responses(
    query: str,
    routing_decision: RoutingDecision,
    agent_responses: Dict[str, Any]
) -> str:
    """
    Synthesize multiple agent responses into a coherent answer.
    
    Args:
        query: Original user query
        routing_decision: Routing decision
        agent_responses: Responses from agents
    
    Returns:
        Synthesized response string
    """
    responses = agent_responses.get("responses", {})
    
    # Single agent response - return directly
    if len(responses) == 1:
        agent_name = list(responses.keys())[0]
        return responses[agent_name].get("response", "No response available")
    
    # Multiple agents - synthesize
    if len(responses) > 1:
        synthesis_prompt = f"""You are synthesizing responses from multiple specialized agents for Cubie AI.

Original Query: {query}

Agent Responses:
"""
        for agent_name, response_data in responses.items():
            synthesis_prompt += f"\n**{agent_name.replace('_', ' ').title()}:**\n{response_data.get('response', 'No response')}\n"
        
        synthesis_prompt += """
Please synthesize these responses into a single, coherent answer that:
1. Addresses all aspects of the user's query
2. Combines information logically
3. Maintains a conversational, helpful tone
4. Cites sources when relevant
5. Is concise but complete

Synthesized Response:"""
        
        messages = [
            SystemMessage(content="You are Cubie AI, synthesizing multi-agent responses."),
            HumanMessage(content=synthesis_prompt)
        ]
        
        result = llm.invoke(messages)
        return result.content
    
    # No responses - error message
    errors = agent_responses.get("errors", {})
    if errors:
        return f"I encountered some issues: {', '.join(errors.values())}"
    
    return "I couldn't generate a response. Please try rephrasing your question."


# Main Router Function
async def route_query(
    user_query: str,
    user_id: Optional[str] = None,
    chat_history: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Main router function that classifies and routes queries.
    
    Args:
        user_query: User's question
        user_id: Optional user ID for authenticated requests
        chat_history: Optional chat history
    
    Returns:
        Dict with final response and metadata
    """
    start_time = datetime.now()
    
    # Step 1: Classify the query
    routing_decision = await classify_query(user_query, user_id)
    
    # Step 2: Execute appropriate agent(s)
    agent_responses = await execute_agents(
        user_query,
        routing_decision,
        user_id,
        chat_history
    )
    
    # Step 3: Synthesize responses
    final_response = synthesize_responses(
        user_query,
        routing_decision,
        agent_responses
    )
    
    end_time = datetime.now()
    
    # Compile metadata
    processing_time = (end_time - start_time).total_seconds() * 1000
    
    return {
        "response": final_response,
        "routing_decision": {
            "primary_category": routing_decision.primary_category,
            "secondary_categories": routing_decision.secondary_categories,
            "agents_called": [agent.value for agent in routing_decision.agents_to_call],
            "requires_user_data": routing_decision.requires_user_data,
            "confidence": routing_decision.confidence,
            "reasoning": routing_decision.reasoning
        },
        "agent_responses": agent_responses,
        "processing_time_ms": processing_time,
        "timestamp": datetime.now().isoformat()
    }


# Example usage
async def main():
    """Example usage of Router Agent"""
    
    print("=== Cubie AI Router Agent Examples ===\n")
    
    # Example 1: WCA Competition Query
    print("1. WCA Competition Query:")
    result1 = await route_query("What competitions are coming up in India?")
    print(f"Response: {result1['response'][:200]}...")
    print(f"Routing: {result1['routing_decision']}")
    print()
    
    # Example 2: Personal Performance Query (requires user_id)
    print("2. Personal Performance Query:")
    result2 = await route_query(
        "How are my 3x3 times looking this month?",
        user_id="user_123"
    )
    print(f"Response: {result2['response'][:200]}...")
    print(f"Routing: {result2['routing_decision']}")
    print()
    
    # Example 3: Learning/Tutorial Query
    print("3. Learning Query:")
    result3 = await route_query("How do I improve my F2L look-ahead?")
    print(f"Response: {result3['response'][:200]}...")
    print(f"Routing: {result3['routing_decision']}")
    print()
    
    # Example 4: Multi-Agent Query
    print("4. Multi-Agent Query:")
    result4 = await route_query(
        "Compare my current average to the world record for 3x3",
        user_id="user_123"
    )
    print(f"Response: {result4['response'][:200]}...")
    print(f"Routing: {result4['routing_decision']}")
    print()
    
    # Example 5: Product Review Query
    print("5. Product Review Query:")
    result5 = await route_query("What's the best budget 3x3 cube in 2025?")
    print(f"Response: {result5['response'][:200]}...")
    print(f"Routing: {result5['routing_decision']}")
    print()
    
    # Example 6: General Chat
    print("6. General Chat:")
    result6 = await route_query("Hello! How are you?")
    print(f"Response: {result6['response']}")
    print(f"Routing: {result6['routing_decision']}")
    print()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())