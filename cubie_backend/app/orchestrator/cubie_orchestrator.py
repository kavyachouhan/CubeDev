"""
Cubie AI Orchestrator - Complete Agentic RAG System
Coordinates router agent, specialized agents, RAG, and response generation
"""

from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import asyncio
import json

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

# Import agents
from app.agents.router_agent import route_query, classify_query, RoutingDecision
from app.agents.cubedev_agent import query_cubedev_agent
from app.agents.wca_agent import query_wca_agent
from app.agents.web_search_agent import query_web_search_agent

# Import services
from app.db.chat_service import ChatService
from app.rag.knowledge_base import get_knowledge_manager, KnowledgeBaseManager
from app.memory.conversation_memory import ConversationMemoryManager
from app.models.chat import Role, MessageMetadata, ToolUsage, ToolType

import os
from dotenv import load_dotenv

load_dotenv()


class CubieOrchestrator:
    """
    Main orchestrator for Cubie AI's agentic RAG system.
    Handles complete query flow from user input to final response.
    """
    
    def __init__(
        self,
        chat_service: ChatService,
        knowledge_manager: Optional[KnowledgeBaseManager] = None,
        llm: Optional[ChatGoogleGenerativeAI] = None
    ):
        """
        Initialize the orchestrator.
        
        Args:
            chat_service: ChatService instance for database operations
            knowledge_manager: Optional KnowledgeBaseManager for RAG
            llm: Optional LLM instance
        """
        self.chat_service = chat_service
        self.knowledge_manager = knowledge_manager or get_knowledge_manager()
        
        self.llm = llm or ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL"),
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3
        )
        
        self.memory_manager = ConversationMemoryManager(
            chat_service=chat_service,
            llm=self.llm
        )
    
    async def process_query(
        self,
        user_query: str,
        user_id: str,
        session_id: str,
        use_rag: bool = True,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Process a user query through the complete agentic RAG system.
        
        Flow:
        1. Load conversation context from memory
        2. Augment with RAG retrieval if applicable
        3. Route to appropriate agent(s) via router
        4. Execute specialized agent(s)
        5. Synthesize multi-agent responses
        6. Generate final response with LLM
        7. Save to database with metadata
        
        Args:
            user_query: User's question
            user_id: User's ID from Convex
            session_id: Chat session ID
            use_rag: Whether to use RAG retrieval
            stream: Whether to stream the response
        
        Returns:
            Dict with final response and metadata
        """
        start_time = datetime.now()
        processing_steps = []
        
        try:
            # Step 1: Save user message to database
            self.chat_service.create_message(
                chat_session_id=session_id,
                user_id=user_id,
                role=Role.USER,
                content=user_query
            )
            processing_steps.append({
                "step": "save_user_message",
                "status": "success",
                "timestamp": datetime.now().isoformat()
            })
            
            # Step 2: Load conversation context
            chat_history = await self.memory_manager.get_windowed_history(
                session_id=session_id,
                window_size=10
            )
            processing_steps.append({
                "step": "load_context",
                "status": "success",
                "history_length": len(chat_history),
                "timestamp": datetime.now().isoformat()
            })
            
            # Step 3: RAG Retrieval (if enabled and query is knowledge-seeking)
            rag_context = None
            if use_rag:
                rag_context = await self._retrieve_rag_context(user_query)
                processing_steps.append({
                    "step": "rag_retrieval",
                    "status": "success",
                    "documents_retrieved": len(rag_context.get("results", [])),
                    "timestamp": datetime.now().isoformat()
                })
            
            # Step 4: Classify and route the query
            routing_decision = await classify_query(user_query, user_id)
            processing_steps.append({
                "step": "routing",
                "status": "success",
                "primary_category": routing_decision.primary_category,
                "agents_to_call": [agent.value for agent in routing_decision.agents_to_call],
                "confidence": routing_decision.confidence,
                "timestamp": datetime.now().isoformat()
            })
            
            # Step 5: Execute specialized agents
            agent_responses = await self._execute_agents(
                query=user_query,
                routing_decision=routing_decision,
                user_id=user_id,
                chat_history=chat_history
            )
            processing_steps.append({
                "step": "agent_execution",
                "status": "success",
                "agents_executed": list(agent_responses.get("responses", {}).keys()),
                "timestamp": datetime.now().isoformat()
            })
            
            # Step 6: Synthesize and generate final response
            final_response, metadata = await self._generate_final_response(
                query=user_query,
                routing_decision=routing_decision,
                agent_responses=agent_responses,
                rag_context=rag_context,
                chat_history=chat_history
            )
            processing_steps.append({
                "step": "response_generation",
                "status": "success",
                "timestamp": datetime.now().isoformat()
            })
            
            # Step 7: Save bot response to database
            self.chat_service.create_message(
                chat_session_id=session_id,
                user_id=user_id,
                role=Role.BOT,
                content=final_response,
                metadata=metadata
            )
            processing_steps.append({
                "step": "save_bot_message",
                "status": "success",
                "timestamp": datetime.now().isoformat()
            })
            
            # Step 8: Auto-generate session title if this is the first exchange and not already generated
            session = self.chat_service.get_session(session_id)
            if session and not session.title_generated:
                session_stats = self.chat_service.get_session_stats(session_id)
                if session_stats.get("total_messages", 0) <= 2:  # First Q&A pair
                    self.chat_service.auto_generate_session_title(
                        session_id=session_id,
                        first_user_message=user_query
                    )
            
            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds() * 1000
            
            return {
                "status": "success",
                "response": final_response,
                "metadata": metadata.model_dump() if metadata else None,
                "routing": {
                    "primary_category": routing_decision.primary_category,
                    "agents_called": [agent.value for agent in routing_decision.agents_to_call],
                    "confidence": routing_decision.confidence,
                    "reasoning": routing_decision.reasoning
                },
                "processing_time_ms": total_time,
                "processing_steps": processing_steps,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            # Log error with more details for debugging
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error in process_query: {str(e)}")
            print(f"Traceback:\n{error_traceback}")
            
            # Log error and return error response
            error_response = f"I apologize, but I encountered an error processing your request: {str(e)}"
            
            # Try to save error response
            try:
                self.chat_service.create_message(
                    chat_session_id=session_id,
                    user_id=user_id,
                    role=Role.BOT,
                    content=error_response
                )
            except:
                pass
            
            return {
                "status": "error",
                "response": error_response,
                "error": str(e),
                "processing_steps": processing_steps,
                "timestamp": datetime.now().isoformat()
            }
    
    async def process_query_stream(
        self,
        user_query: str,
        user_id: str,
        session_id: str,
        use_rag: bool = True
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process a user query with streaming response.
        
        Args:
            user_query: User's question
            user_id: User's ID
            session_id: Chat session ID
            use_rag: Whether to use RAG retrieval
        
        Yields:
            Dict chunks with response data
        """
        start_time = datetime.now()
        
        try:
            # Save user message
            self.chat_service.create_message(
                chat_session_id=session_id,
                user_id=user_id,
                role=Role.USER,
                content=user_query
            )
            
            yield {"type": "status", "message": "Processing query..."}
            
            # Load conversation context
            chat_history = await self.memory_manager.get_windowed_history(
                session_id=session_id,
                window_size=10
            )
            
            # RAG Retrieval
            rag_context = None
            if use_rag:
                yield {"type": "status", "message": "Searching knowledge base..."}
                rag_context = await self._retrieve_rag_context(user_query)
            
            # Route query
            yield {"type": "status", "message": "Routing query to appropriate agents..."}
            routing_decision = await classify_query(user_query, user_id)
            
            # Build agent status message
            from app.agents.router_agent import AgentType
            agent_names = []
            for agent_type in routing_decision.agents_to_call:
                if agent_type == AgentType.WCA_AGENT:
                    agent_names.append("WCA Agent")
                elif agent_type == AgentType.CUBEDEV_AGENT:
                    agent_names.append("CubeDev Agent")
                elif agent_type == AgentType.WEB_SEARCH_AGENT:
                    agent_names.append("Web Search Agent")
                elif agent_type == AgentType.GENERAL_LLM:
                    agent_names.append("General Assistant")
            
            if agent_names:
                yield {"type": "status", "message": f"Calling {', '.join(agent_names)}..."}
            
            # Execute agents
            agent_responses = await self._execute_agents(
                query=user_query,
                routing_decision=routing_decision,
                user_id=user_id,
                chat_history=chat_history
            )
            
            # Generate final response with streaming
            yield {"type": "status", "message": "Synthesizing response..."}
            
            final_response, metadata = await self._generate_final_response(
                query=user_query,
                routing_decision=routing_decision,
                agent_responses=agent_responses,
                rag_context=rag_context,
                chat_history=chat_history
            )
            
            # Extract final text and ensure metadata is properly constructed
            if isinstance(final_response, tuple):
                final_text, metadata = final_response
            else:
                final_text = final_response
            
            # Calculate total processing time
            end_time = datetime.now()
            total_processing_time_ms = (end_time - start_time).total_seconds() * 1000
            
            # Ensure metadata exists and has all required fields
            if not metadata:
                tools_used = self._extract_tools_used(agent_responses.get("responses", {}))
                if not tools_used:
                    # Fallback if no specific tools were tracked
                    tools_used = [ToolUsage(
                        tool_type=ToolType.KNOWLEDGE_BASE, 
                        query=user_query, 
                        result_summary=f"Used {len(agent_responses.get('responses', {}))} agents"
                    )]
                metadata = MessageMetadata(
                    tools_used=tools_used,
                    sources=self._extract_sources(agent_responses, rag_context),
                    total_processing_time_ms=total_processing_time_ms,
                    model_version=os.getenv("GEMINI_MODEL")
                )
            else:
                # Update metadata with total processing time if not set
                if not metadata.total_processing_time_ms:
                    metadata.total_processing_time_ms = total_processing_time_ms
                # Ensure model version is set
                if not metadata.model_version:
                    metadata.model_version = os.getenv("GEMINI_MODEL")
            
            # Stream the response word by word
            words = final_text.split()
            response_text = ""
            for word in words:
                response_text += word + " "
                yield {
                    "type": "content",
                    "content": word + " ",
                    "partial": response_text.strip()
                }
                await asyncio.sleep(0.01)
            
            # Save bot message to database AFTER streaming completes
            message_id = None
            try:
                bot_message = self.chat_service.create_message(
                    chat_session_id=session_id,
                    user_id=user_id,
                    role=Role.BOT,
                    content=final_text,
                    metadata=metadata
                )
                message_id = str(bot_message.id)
                print(f"✅ Bot message saved successfully: {message_id}")
                print(f"   - Tools used: {len(metadata.tools_used) if metadata.tools_used else 0}")
                print(f"   - Processing time: {metadata.total_processing_time_ms}ms")
            except Exception as save_error:
                print(f"❌ Failed to save bot message: {save_error}")
                # Continue anyway to send complete event
            
            yield {"type": "complete", "response": final_text, "metadata": metadata.model_dump(), "message_id": message_id}
            
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"❌ Error in process_query_stream: {str(e)}")
            print(f"Traceback:\n{error_traceback}")
            yield {"type": "error", "error": str(e)}
    
    async def _retrieve_rag_context(
        self,
        query: str,
        k: int = 5
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context from knowledge base using RAG.
        
        Args:
            query: User query
            k: Number of documents to retrieve
        
        Returns:
            Dict with retrieved documents
        """
        try:
            return await self.knowledge_manager.query_knowledge(
                query=query,
                k=k,
                use_mmr=True
            )
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "results": []
            }
    
    async def _execute_agents(
        self,
        query: str,
        routing_decision: RoutingDecision,
        user_id: str,
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Execute specialized agents based on routing decision.
        
        Args:
            query: User query
            routing_decision: Routing decision from router
            user_id: User ID
            chat_history: Conversation history
        
        Returns:
            Dict with agent responses
        """
        from app.agents.router_agent import AgentType
        
        responses = {}
        errors = {}
        
        # Create tasks for parallel execution
        tasks = []
        agent_names = []
        
        for agent_type in routing_decision.agents_to_call:
            if agent_type == AgentType.WCA_AGENT:
                tasks.append(query_wca_agent(query, chat_history))
                agent_names.append("wca_agent")
                
            elif agent_type == AgentType.CUBEDEV_AGENT:
                if user_id:
                    tasks.append(query_cubedev_agent(query, user_id, chat_history))
                    agent_names.append("cubedev_agent")
                else:
                    errors["cubedev_agent"] = "User authentication required"
                
            elif agent_type == AgentType.WEB_SEARCH_AGENT:
                tasks.append(query_web_search_agent(query, chat_history))
                agent_names.append("web_search_agent")
                
            elif agent_type == AgentType.GENERAL_LLM:
                # Direct LLM call
                tasks.append(self._call_general_llm(query, chat_history))
                agent_names.append("general_llm")
        
        # Execute agents in parallel
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for agent_name, result in zip(agent_names, results):
                if isinstance(result, Exception):
                    errors[agent_name] = str(result)
                else:
                    responses[agent_name] = result
        
        return {
            "responses": responses,
            "errors": errors
        }
    
    async def _call_general_llm(
        self,
        query: str,
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Call general LLM for simple queries."""
        messages = []
        
        for msg in chat_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=query))
        
        start_time = datetime.now()
        result = await self.llm.ainvoke(messages)
        end_time = datetime.now()
        
        return {
            "response": result.content,
            "tools_used": [],
            "processing_time_ms": (end_time - start_time).total_seconds() * 1000
        }
    
    async def _generate_final_response(
        self,
        query: str,
        routing_decision: RoutingDecision,
        agent_responses: Dict[str, Any],
        rag_context: Optional[Dict[str, Any]],
        chat_history: List[Dict[str, str]]
    ) -> tuple[str, MessageMetadata]:
        """
        Generate final synthesized response with metadata.
        
        Args:
            query: User query
            routing_decision: Routing decision
            agent_responses: Responses from agents
            rag_context: RAG retrieval context
            chat_history: Conversation history
        
        Returns:
            Tuple of (final_response_text, metadata)
        """
        start_time = datetime.now()
        
        responses = agent_responses.get("responses", {})
        errors = agent_responses.get("errors", {})
        
        # Single agent response - return directly with RAG augmentation if available
        if len(responses) == 1 and not rag_context:
            agent_name = list(responses.keys())[0]
            response_data = responses[agent_name]
            
            final_text = response_data.get("response", "No response available")
            tools_used = self._extract_tools_used(responses)
            
            # Ensure we have at least one tool usage entry
            if not tools_used:
                tools_used = [ToolUsage(
                    tool_type=ToolType.KNOWLEDGE_BASE,
                    query=query,
                    result_summary=f"Used {agent_name}"
                )]
            
            end_time = datetime.now()
            
            metadata = MessageMetadata(
                tools_used=tools_used,
                sources=self._extract_sources(responses, rag_context),
                total_processing_time_ms=(end_time - start_time).total_seconds() * 1000,
                model_version=os.getenv("GEMINI_MODEL")
            )
            
            return final_text, metadata
        
        # Multiple agents or RAG context - synthesize
        synthesis_prompt = self._build_synthesis_prompt(
            query=query,
            agent_responses=responses,
            rag_context=rag_context,
            errors=errors
        )
        
        messages = [
            SystemMessage(content="You are Cubie AI, synthesizing information from multiple sources to provide a comprehensive answer."),
            HumanMessage(content=synthesis_prompt)
        ]
        
        result = await self.llm.ainvoke(messages)
        final_text = result.content
        
        # Build metadata
        tools_used = self._extract_tools_used(responses)
        sources = self._extract_sources(responses, rag_context)
        
        end_time = datetime.now()
        
        metadata = MessageMetadata(
            tools_used=tools_used,
            sources=sources,
            total_processing_time_ms=(end_time - start_time).total_seconds() * 1000,
            model_version=os.getenv("GEMINI_MODEL")
        )
        
        return final_text, metadata
    
    def _build_synthesis_prompt(
        self,
        query: str,
        agent_responses: Dict[str, Any],
        rag_context: Optional[Dict[str, Any]],
        errors: Dict[str, str]
    ) -> str:
        """Build synthesis prompt for multi-source responses."""
        prompt_parts = [
            f"User Query: {query}\n",
            "\n--- Information from Specialized Agents ---\n"
        ]
        
        # Add agent responses - ensure all values are strings
        for agent_name, response_data in agent_responses.items():
            prompt_parts.append(f"\n{agent_name.replace('_', ' ').title()}:")
            response_content = response_data.get("response", "No response")
            # Ensure response is a string
            if isinstance(response_content, (list, dict)):
                response_content = str(response_content)
            prompt_parts.append(str(response_content))
            prompt_parts.append("\n")
        
        # Add RAG context if available
        if rag_context and rag_context.get("status") == "success":
            results = rag_context.get("results", [])
            if results:
                prompt_parts.append("\n--- Knowledge Base Context ---\n")
                for idx, result in enumerate(results[:3], 1):
                    prompt_parts.append(f"\nDocument {idx}:")
                    content = result.get("content", "")
                    # Ensure content is a string
                    if isinstance(content, (list, dict)):
                        content = str(content)
                    prompt_parts.append(str(content)[:500])
                    prompt_parts.append("\n")
        
        # Add errors if any
        if errors:
            prompt_parts.append("\n--- Errors/Limitations ---\n")
            for agent, error in errors.items():
                prompt_parts.append(f"{agent}: {str(error)}\n")
        
        prompt_parts.append("""
\nPlease synthesize the above information into a comprehensive, coherent answer that:
1. Directly addresses the user's query
2. Integrates information from all sources naturally
3. Maintains a conversational, helpful tone
4. Cites sources when relevant
5. Is accurate and complete
6. Acknowledges any limitations or missing information

Synthesized Response:""")
        
        return "".join(prompt_parts)
    
    def _extract_tools_used(
        self,
        agent_responses: Dict[str, Any]
    ) -> List[ToolUsage]:
        """Extract tool usage information from agent responses."""
        tools_used = []
        
        for agent_name, response_data in agent_responses.items():
            agent_tools = response_data.get("tools_used", [])
            
            if agent_tools:
                # Process existing tools from agent response
                for tool_info in agent_tools:
                    # Map agent tools to ToolType enum
                    tool_type = self._map_to_tool_type(agent_name, tool_info.get("tool_name", ""))
                    
                    tools_used.append(ToolUsage(
                        tool_type=tool_type,
                        query=str(tool_info.get("arguments", {})),
                        execution_time_ms=tool_info.get("execution_time_ms"),
                        metadata=tool_info
                    ))
            else:
                # Create a tool usage entry for the agent even if no specific tools were reported
                tool_type = self._map_to_tool_type(agent_name, "")
                tools_used.append(ToolUsage(
                    tool_type=tool_type,
                    query=response_data.get("query", ""),
                    result_summary=f"Agent: {agent_name.replace('_', ' ').title()}",
                    execution_time_ms=response_data.get("processing_time_ms")
                ))
        
        return tools_used
    
    def _map_to_tool_type(self, agent_name: str, tool_name: str) -> ToolType:
        """Map agent/tool name to ToolType enum."""
        if "wca" in agent_name.lower():
            return ToolType.WCA_DATA
        elif "cubedev" in agent_name.lower():
            return ToolType.SOLVE_ANALYSIS
        else:
            return ToolType.KNOWLEDGE_BASE
    
    def _extract_sources(
        self,
        agent_responses: Dict[str, Any],
        rag_context: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Extract source citations from responses."""
        sources = []
        
        # Add RAG sources
        if rag_context and rag_context.get("status") == "success":
            for result in rag_context.get("results", [])[:5]:
                metadata = result.get("metadata", {})
                sources.append({
                    "type": "knowledge_base",
                    "title": metadata.get("title", "Knowledge Base"),
                    "category": metadata.get("category", ""),
                    "source": metadata.get("source", "")
                })
        
        # Add web search sources
        if "web_search_agent" in agent_responses:
            web_sources = agent_responses["web_search_agent"].get("sources", [])
            sources.extend(web_sources)
        
        return sources
    
    async def create_new_session(
        self,
        user_id: str,
        initial_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new chat session.
        
        Args:
            user_id: User's ID
            initial_message: Optional initial message
        
        Returns:
            Dict with session info
        """
        session = self.chat_service.create_session(user_id=user_id)
        
        return {
            "session_id": str(session.id),
            "user_id": user_id,
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat()
        }
    
    async def get_session_history(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get session chat history.
        
        Args:
            session_id: Session ID
            limit: Optional message limit
        
        Returns:
            List of messages
        """
        messages = self.chat_service.get_session_messages(
            session_id=session_id,
            limit=limit
        )
        
        return [
            {
                "id": str(msg.id),
                "role": "user" if msg.role.value == "user" else "assistant",
                "content": msg.content,
                "metadata": msg.metadata.model_dump() if msg.metadata else None,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]


# Global orchestrator instance
_orchestrator_instance = None


def get_orchestrator(chat_service: ChatService) -> CubieOrchestrator:
    """
    Get or create global orchestrator instance.
    
    Args:
        chat_service: ChatService instance
    
    Returns:
        CubieOrchestrator instance
    """
    global _orchestrator_instance
    
    if _orchestrator_instance is None:
        _orchestrator_instance = CubieOrchestrator(chat_service=chat_service)
    
    return _orchestrator_instance
