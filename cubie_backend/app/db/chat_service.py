"""
MongoDB Chat Service for Cubie AI
Handles CRUD operations for chat sessions and messages
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pymongo.database import Database
from bson import ObjectId
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from app.models.chat import (
    ChatSession,
    Message,
    Role,
    MessageMetadata,
    ToolUsage,
    ToolType,
    MessageFeedback,
    get_utc_now
)


class ChatService:
    """Service class for chat operations in MongoDB"""
    
    def __init__(self, db: Database):
        self.db = db
        self.sessions_collection = db["chat_sessions"]
        self.messages_collection = db["chat_messages"]
        
        # Create indexes for better query performance
        self._create_indexes()
    
    def _create_indexes(self):
        """Create necessary indexes for collections"""
        # Chat sessions indexes
        self.sessions_collection.create_index("user_id")
        self.sessions_collection.create_index([("user_id", 1), ("created_at", -1)])
        
        # Messages indexes
        self.messages_collection.create_index("chat_session_id")
        self.messages_collection.create_index("user_id")
        self.messages_collection.create_index([("chat_session_id", 1), ("created_at", 1)])
        self.messages_collection.create_index([("user_id", 1), ("created_at", -1)])
    
    # ==================== SESSION OPERATIONS ====================
    
    def create_session(self, user_id: str, title: str = "New Chat") -> ChatSession:
        """
        Create a new chat session.
        
        Args:
            user_id: User's ID from Convex
            title: Session title
        
        Returns:
            Created ChatSession object
        """
        session = ChatSession(
            user_id=user_id,
            title=title,
            title_generated=False,
            created_at=get_utc_now(),
            updated_at=get_utc_now()
        )
        
        # Convert to dict for MongoDB insertion
        session_dict = session.model_dump(by_alias=True, exclude={"id"})
        
        result = self.sessions_collection.insert_one(session_dict)
        session.id = result.inserted_id
        
        return session
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """
        Get a chat session by ID.
        
        Args:
            session_id: Session ID
        
        Returns:
            ChatSession object or None if not found
        """
        try:
            session_data = self.sessions_collection.find_one({"_id": ObjectId(session_id)})
            
            if session_data:
                return ChatSession(**session_data)
            
            return None
        except Exception as e:
            print(f"Error fetching session: {e}")
            return None
    
    def get_user_sessions(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> List[ChatSession]:
        """
        Get all sessions for a user.
        
        Args:
            user_id: User's ID
            limit: Maximum number of sessions to return
            skip: Number of sessions to skip
        
        Returns:
            List of ChatSession objects
        """
        sessions_data = self.sessions_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).skip(skip).limit(limit)
        
        return [ChatSession(**session) for session in sessions_data]
    
    def update_session(
        self,
        session_id: str,
        title: Optional[str] = None,
        **kwargs
    ) -> bool:
        """
        Update a chat session.
        
        Args:
            session_id: Session ID
            title: Optional new title
            **kwargs: Additional fields to update
        
        Returns:
            True if update successful, False otherwise
        """
        try:
            update_data = {"updated_at": get_utc_now()}
            
            if title:
                update_data["title"] = title
            
            update_data.update(kwargs)
            
            result = self.sessions_collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating session: {e}")
            return False
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a chat session and all its messages.
        
        Args:
            session_id: Session ID
        
        Returns:
            True if deletion successful, False otherwise
        """
        try:
            # Delete all messages in the session
            self.messages_collection.delete_many({"chat_session_id": ObjectId(session_id)})
            
            # Delete the session
            result = self.sessions_collection.delete_one({"_id": ObjectId(session_id)})
            
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False
    
    # ==================== MESSAGE OPERATIONS ====================
    
    def create_message(
        self,
        chat_session_id: str,
        user_id: str,
        role: Role,
        content: str,
        metadata: Optional[MessageMetadata] = None
    ) -> Message:
        """
        Create a new message in a chat session.
        
        Args:
            chat_session_id: Session ID
            user_id: User's ID
            role: Message role (user or bot)
            content: Message content
            metadata: Optional message metadata
        
        Returns:
            Created Message object
        """
        try:
            message = Message(
                chat_session_id=ObjectId(chat_session_id),
                user_id=user_id,
                role=role,
                content=content,
                metadata=metadata,
                created_at=get_utc_now()
            )
            
            # Convert to dict for MongoDB insertion
            message_dict = message.model_dump(by_alias=True, exclude={"id"})
            
            # CRITICAL FIX: Ensure chat_session_id is stored as ObjectId, not string
            # The model_dump() converts it to string, but MongoDB needs ObjectId for querying
            message_dict['chat_session_id'] = ObjectId(chat_session_id)
            
            result = self.messages_collection.insert_one(message_dict)
            message.id = result.inserted_id
            
            # Update session's updated_at timestamp
            self.update_session(chat_session_id)
            
            return message
        except Exception as e:
            print(f"Error creating message: {e}")
            raise
    
    def get_message(self, message_id: str) -> Optional[Message]:
        """
        Get a message by ID.
        
        Args:
            message_id: Message ID
        
        Returns:
            Message object or None if not found
        """
        try:
            message_data = self.messages_collection.find_one({"_id": ObjectId(message_id)})
            
            if message_data:
                return Message(**message_data)
            
            return None
        except Exception as e:
            print(f"Error fetching message: {e}")
            return None
    
    def get_session_messages(
        self,
        session_id: str,
        limit: Optional[int] = None,
        skip: int = 0
    ) -> List[Message]:
        """
        Get all messages in a chat session.
        
        Args:
            session_id: Session ID
            limit: Optional maximum number of messages to return
            skip: Number of messages to skip
        
        Returns:
            List of Message objects ordered by creation time
        """
        try:
            # Query for BOTH ObjectId and string format for backward compatibility
            # Some messages might have been stored as strings before the fix
            query = {
                "$or": [
                    {"chat_session_id": ObjectId(session_id)},
                    {"chat_session_id": session_id}
                ]
            }
            
            cursor = self.messages_collection.find(query).sort("created_at", 1).skip(skip)
            
            if limit:
                cursor = cursor.limit(limit)
            
            messages = list(cursor)
            
            return [Message(**msg) for msg in messages]
        except Exception as e:
            print(f"Error in get_session_messages: {e}")
            return []
    
    def get_recent_messages(
        self,
        session_id: str,
        count: int = 10
    ) -> List[Message]:
        """
        Get the most recent messages from a session.
        
        Args:
            session_id: Session ID
            count: Number of recent messages to fetch
        
        Returns:
            List of recent Message objects
        """
        # Query for BOTH ObjectId and string format for backward compatibility
        query = {
            "$or": [
                {"chat_session_id": ObjectId(session_id)},
                {"chat_session_id": session_id}
            ]
        }
        
        messages = self.messages_collection.find(query).sort("created_at", -1).limit(count)
        
        # Reverse to get chronological order
        return list(reversed([Message(**msg) for msg in messages]))
    
    def update_message_feedback(
        self,
        message_id: str,
        feedback: MessageFeedback
    ) -> bool:
        """
        Update message feedback.
        
        Args:
            message_id: Message ID
            feedback: MessageFeedback object
        
        Returns:
            True if update successful, False otherwise
        """
        try:
            result = self.messages_collection.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": {"feedback": feedback.model_dump()}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating message feedback: {e}")
            return False
    
    # ==================== UTILITY OPERATIONS ====================
    
    def get_conversation_history(
        self,
        session_id: str,
        message_limit: int = 20
    ) -> List[Dict[str, str]]:
        """
        Get conversation history in a format suitable for LLM context.
        
        Args:
            session_id: Session ID
            message_limit: Maximum number of messages to include
        
        Returns:
            List of message dicts with role and content
        """
        messages = self.get_recent_messages(session_id, message_limit)
        
        return [
            {
                "role": "user" if msg.role == Role.USER else "assistant",
                "content": msg.content
            }
            for msg in messages
        ]
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """
        Get statistics for a chat session.
        
        Args:
            session_id: Session ID
        
        Returns:
            Dictionary with session statistics
        """
        try:
            # Query for BOTH ObjectId and string format for backward compatibility
            query_base = {
                "$or": [
                    {"chat_session_id": ObjectId(session_id)},
                    {"chat_session_id": session_id}
                ]
            }
            
            # Count messages by role
            total_messages = self.messages_collection.count_documents(query_base)
            
            user_query = {**query_base, "role": Role.USER}
            user_messages = self.messages_collection.count_documents(user_query)
            
            bot_query = {**query_base, "role": Role.BOT}
            bot_messages = self.messages_collection.count_documents(bot_query)
            
            # Get first and last message timestamps
            first_message = self.messages_collection.find_one(
                query_base,
                sort=[("created_at", 1)]
            )
            
            last_message = self.messages_collection.find_one(
                query_base,
                sort=[("created_at", -1)]
            )
            
            return {
                "total_messages": total_messages,
                "user_messages": user_messages,
                "bot_messages": bot_messages,
                "first_message_at": first_message["created_at"] if first_message else None,
                "last_message_at": last_message["created_at"] if last_message else None
            }
        except Exception as e:
            print(f"Error getting session stats: {e}")
            return {}
    
    def search_messages(
        self,
        user_id: str,
        search_query: str,
        limit: int = 20
    ) -> List[Message]:
        """
        Search messages by content.
        
        Args:
            user_id: User's ID
            search_query: Text to search for
            limit: Maximum number of results
        
        Returns:
            List of matching Message objects
        """
        try:
            # Create text index if not exists
            self.messages_collection.create_index([("content", "text")])
            
            messages = self.messages_collection.find(
                {
                    "user_id": user_id,
                    "$text": {"$search": search_query}
                },
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            return [Message(**msg) for msg in messages]
        except Exception as e:
            print(f"Error searching messages: {e}")
            return []
    
    def auto_generate_session_title(
        self,
        session_id: str,
        first_user_message: str
    ) -> str:
        """
        Auto-generate a session title based on the first user message using LLM.
        
        Args:
            session_id: Session ID
            first_user_message: First message from user
        
        Returns:
            Generated title (concise, 3-5 words)
        """
        try:
            # Initialize LLM for title generation
            llm = ChatGoogleGenerativeAI(
                model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
                google_api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.5
            )
            
            # Create prompt for title generation
            prompt = f"""Generate a concise, descriptive title (3-5 words) based on the following user message.

User's first message:
"{first_user_message}"
"""
            
            # Generate title
            response = llm.invoke(prompt)
            title = response.content.strip()
            
            # Clean up and ensure reasonable length
            title = title.replace('"', '').replace("'", "").strip()
            
            # Fallback to truncation if LLM fails
            if not title or len(title) > 100:
                title = first_user_message[:50].strip()
                if len(first_user_message) > 50:
                    title += "..."
            
        except Exception as e:
            print(f"Error generating title with LLM: {e}, falling back to truncation")
            # Fallback to simple truncation
            title = first_user_message[:50].strip()
            if len(first_user_message) > 50:
                title += "..."
        
        # Update session with generated title and set flag to prevent re-generation
        self.update_session(session_id, title=title, title_generated=True)
        
        return title
