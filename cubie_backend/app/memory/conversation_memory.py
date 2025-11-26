"""
Conversation Memory Management for Cubie AI
Handles conversation context, memory persistence, and history management
"""

from typing import List, Dict, Any, Optional
from langchain_classic.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from app.db.chat_service import ChatService
from app.models.chat import Role
import os
import numpy as np
from numpy.linalg import norm


class MongoDBChatMessageHistory:
    """
    Custom chat message history that stores messages in MongoDB via ChatService.
    """
    
    def __init__(self, chat_service: ChatService, session_id: str, user_id: str):
        """
        Initialize MongoDB chat message history.
        
        Args:
            chat_service: ChatService instance
            session_id: Chat session ID
            user_id: User ID
        """
        self.chat_service = chat_service
        self.session_id = session_id
        self.user_id = user_id
        self._messages: List[BaseMessage] = []
        self._loaded = False
    
    async def _load_messages(self):
        """Load messages from MongoDB if not already loaded."""
        if not self._loaded:
            messages = self.chat_service.get_session_messages(self.session_id)
            self._messages = [
                HumanMessage(content=msg.content) if msg.role == Role.USER
                else AIMessage(content=msg.content)
                for msg in messages
            ]
            self._loaded = True
    
    async def add_user_message(self, message: str) -> None:
        """Add a user message to the history."""
        self.chat_service.create_message(
            chat_session_id=self.session_id,
            user_id=self.user_id,
            role=Role.USER,
            content=message
        )
        self._messages.append(HumanMessage(content=message))
    
    async def add_ai_message(self, message: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add an AI message to the history."""
        from app.models.chat import MessageMetadata
        
        msg_metadata = None
        if metadata:
            msg_metadata = MessageMetadata(**metadata)
        
        self.chat_service.create_message(
            chat_session_id=self.session_id,
            user_id=self.user_id,
            role=Role.BOT,
            content=message,
            metadata=msg_metadata
        )
        self._messages.append(AIMessage(content=message))
    
    async def get_messages(self) -> List[BaseMessage]:
        """Get all messages from history."""
        await self._load_messages()
        return self._messages
    
    async def clear(self) -> None:
        """Clear message history."""
        self._messages = []
        self._loaded = False


class ConversationMemoryManager:
    """
    Manages conversation memory with different strategies.
    Supports buffer memory, summary memory, and windowed memory.
    """
    
    def __init__(
        self,
        chat_service: ChatService,
        llm: Optional[ChatGoogleGenerativeAI] = None,
        memory_type: str = "buffer",
        max_token_limit: int = 2000
    ):
        """
        Initialize conversation memory manager.
        
        Args:
            chat_service: ChatService instance
            llm: Optional LLM for summary generation
            memory_type: Type of memory ("buffer", "summary", "window")
            max_token_limit: Maximum tokens for memory
        """
        self.chat_service = chat_service
        self.llm = llm or ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL"),
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.2
        )
        self.memory_type = memory_type
        self.max_token_limit = max_token_limit
    
    def create_memory(
        self,
        session_id: str,
        user_id: str
    ) -> ConversationBufferMemory:
        """
        Create a conversation memory instance for a session.
        
        Args:
            session_id: Chat session ID
            user_id: User ID
        
        Returns:
            ConversationBufferMemory or ConversationSummaryMemory instance
        """
        # Create custom message history
        message_history = MongoDBChatMessageHistory(
            chat_service=self.chat_service,
            session_id=session_id,
            user_id=user_id
        )
        
        if self.memory_type == "summary":
            memory = ConversationSummaryMemory(
                llm=self.llm,
                chat_memory=message_history,
                return_messages=True,
                max_token_limit=self.max_token_limit
            )
        else:
            # Default to buffer memory
            memory = ConversationBufferMemory(
                chat_memory=message_history,
                return_messages=True,
                max_token_limit=self.max_token_limit
            )
        
        return memory
    
    async def get_windowed_history(
        self,
        session_id: str,
        window_size: int = 10
    ) -> List[Dict[str, str]]:
        """
        Get windowed conversation history (last N messages).
        
        Args:
            session_id: Chat session ID
            window_size: Number of recent messages to retrieve
        
        Returns:
            List of message dicts with role and content
        """
        return self.chat_service.get_conversation_history(
            session_id=session_id,
            message_limit=window_size
        )
    
    async def get_summarized_history(
        self,
        session_id: str,
        max_messages: int = 50
    ) -> Dict[str, Any]:
        """
        Get summarized conversation history for long conversations.
        
        Args:
            session_id: Chat session ID
            max_messages: Maximum messages to consider for summary
        
        Returns:
            Dict with summary and recent messages
        """
        messages = self.chat_service.get_recent_messages(
            session_id=session_id,
            count=max_messages
        )
        
        if len(messages) <= 10:
            # For short conversations, return full history
            return {
                "type": "full",
                "messages": [
                    {
                        "role": "user" if msg.role == Role.USER else "assistant",
                        "content": msg.content
                    }
                    for msg in messages
                ]
            }
        
        # For longer conversations, summarize older messages and keep recent ones
        older_messages = messages[:-10]
        recent_messages = messages[-10:]
        
        # Create summary of older messages
        older_text = "\n".join([
            f"{'User' if msg.role == Role.USER else 'Assistant'}: {msg.content}"
            for msg in older_messages
        ])
        
        summary_prompt = f"""Summarize the following conversation history, focusing on key topics discussed and important context:

{older_text}

Provide a concise summary (2-3 paragraphs) that captures the main themes and important details."""
        
        summary_response = await self.llm.ainvoke([HumanMessage(content=summary_prompt)])
        summary = summary_response.content
        
        return {
            "type": "summarized",
            "summary": summary,
            "summary_covers_messages": len(older_messages),
            "recent_messages": [
                {
                    "role": "user" if msg.role == Role.USER else "assistant",
                    "content": msg.content
                }
                for msg in recent_messages
            ]
        }
    
    async def get_relevant_context(
        self,
        session_id: str,
        current_query: str,
        max_messages: int = 20,
        top_k: int = 10,
        similarity_threshold: float = 0.5
    ) -> List[Dict[str, str]]:
        """
        Get relevant conversation context based on current query using semantic filtering.
        Uses embeddings and cosine similarity to select important past messages.
        
        Args:
            session_id: Chat session ID
            current_query: Current user query
            max_messages: Maximum messages to consider
            top_k: Number of most relevant messages to return
            similarity_threshold: Minimum similarity score (0-1) for inclusion
        
        Returns:
            List of relevant message dicts, sorted by relevance
        """
        # Get recent messages
        all_messages = self.chat_service.get_recent_messages(
            session_id=session_id,
            count=max_messages
        )
        
        if not all_messages:
            return []
        
        # If few messages, return all without filtering
        if len(all_messages) <= top_k:
            return [
                {
                    "role": "user" if msg.role == Role.USER else "assistant",
                    "content": msg.content
                }
                for msg in all_messages
            ]
        
        try:
            # Initialize embeddings model
            embeddings_model = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=os.getenv("GEMINI_API_KEY")
            )
            
            # Embed current query
            query_embedding = await embeddings_model.aembed_query(current_query)
            query_vector = np.array(query_embedding)
            
            # Embed all messages and calculate similarity
            message_scores = []
            
            for msg in all_messages:
                try:
                    # Embed message content
                    msg_embedding = await embeddings_model.aembed_query(msg.content)
                    msg_vector = np.array(msg_embedding)
                    
                    # Calculate cosine similarity
                    similarity = np.dot(query_vector, msg_vector) / (norm(query_vector) * norm(msg_vector))
                    
                    # Store message with its similarity score
                    message_scores.append({
                        "message": msg,
                        "similarity": float(similarity)
                    })
                except Exception as e:
                    print(f"Error embedding message: {e}")
                    # Include message with neutral score if embedding fails
                    message_scores.append({
                        "message": msg,
                        "similarity": 0.5
                    })
            
            # Filter by threshold and sort by similarity (descending)
            relevant_messages = [
                item for item in message_scores 
                if item["similarity"] >= similarity_threshold
            ]
            relevant_messages.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Take top-k most relevant
            top_messages = relevant_messages[:top_k]
            
            # If no messages meet threshold, return most recent ones
            if not top_messages:
                top_messages = message_scores[:top_k]
            
            # Return in chronological order (oldest first)
            top_messages.sort(key=lambda x: x["message"].created_at)
            
            return [
                {
                    "role": "user" if item["message"].role == Role.USER else "assistant",
                    "content": item["message"].content,
                    "similarity_score": item["similarity"]
                }
                for item in top_messages
            ]
            
        except Exception as e:
            print(f"Error in semantic filtering: {e}, falling back to recent messages")
            # Fallback to returning recent messages without filtering
            return [
                {
                    "role": "user" if msg.role == Role.USER else "assistant",
                    "content": msg.content
                }
                for msg in all_messages[:top_k]
            ]
    
    async def format_context_for_llm(
        self,
        session_id: str,
        current_query: str,
        include_system_prompt: bool = True,
        system_prompt: Optional[str] = None
    ) -> List[BaseMessage]:
        """
        Format conversation context for LLM input.
        
        Args:
            session_id: Chat session ID
            current_query: Current user query
            include_system_prompt: Whether to include system prompt
            system_prompt: Optional custom system prompt
        
        Returns:
            List of formatted messages for LLM
        """
        messages = []
        
        # Add system prompt if requested
        if include_system_prompt:
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            else:
                messages.append(SystemMessage(content="""You are Cubie AI, a helpful speedcubing assistant on the CubeDev platform.
You provide accurate information about speedcubing, competitions, algorithms, training, and more.
Be friendly, encouraging, and precise in your responses."""))
        
        # Get conversation history
        history = await self.get_summarized_history(session_id)
        
        if history["type"] == "summarized":
            # Add summary as context
            messages.append(SystemMessage(content=f"Previous conversation summary: {history['summary']}"))
            
            # Add recent messages
            for msg in history["recent_messages"]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
        else:
            # Add full history
            for msg in history["messages"]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current query
        messages.append(HumanMessage(content=current_query))
        
        return messages


class MemoryConfig:
    """Configuration for memory management."""
    
    # Memory types
    BUFFER = "buffer"
    SUMMARY = "summary"
    WINDOW = "window"
    
    # Default settings
    DEFAULT_WINDOW_SIZE = 10
    DEFAULT_MAX_TOKENS = 2000
    DEFAULT_SUMMARY_THRESHOLD = 20  # Messages count to trigger summarization
    
    @staticmethod
    def get_optimal_memory_type(message_count: int) -> str:
        """
        Determine optimal memory type based on conversation length.
        
        Args:
            message_count: Number of messages in conversation
        
        Returns:
            Recommended memory type
        """
        if message_count < 10:
            return MemoryConfig.BUFFER
        elif message_count < 30:
            return MemoryConfig.WINDOW
        else:
            return MemoryConfig.SUMMARY
