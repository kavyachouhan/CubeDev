"""
Pydantic schemas for Cubie Chat API
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== REQUEST SCHEMAS ====================

class ChatMessageRequest(BaseModel):
    """Request schema for sending a chat message."""
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="User's message content"
    )
    
    session_id: Optional[str] = Field(
        None,
        description="Existing session ID. If not provided, a new session will be created."
    )
    
    use_rag: bool = Field(
        default=True,
        description="Whether to use RAG (knowledge base retrieval)"
    )
    
    stream: bool = Field(
        default=False,
        description="Whether to stream the response"
    )
    
    @validator("message")
    def validate_message(cls, v):
        """Validate message is not empty after stripping."""
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "How can I improve my F2L speed?",
                "session_id": "507f1f77bcf86cd799439011",
                "use_rag": True,
                "stream": False
            }
        }


class NewSessionRequest(BaseModel):
    """Request schema for creating a new chat session."""
    
    title: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional session title"
    )
    
    initial_message: Optional[str] = Field(
        None,
        max_length=5000,
        description="Optional initial message to start the conversation"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Training Tips",
                "initial_message": "I want to improve my 3x3 times"
            }
        }


class MessageFeedbackRequest(BaseModel):
    """Request schema for providing feedback on a message."""
    
    message_id: str = Field(..., description="ID of the message to provide feedback for")
    
    feedback_type: str = Field(
        ...,
        description="Type of feedback: 'like' or 'dislike'"
    )
    
    comment: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional feedback comment"
    )
    
    @validator("feedback_type")
    def validate_feedback_type(cls, v):
        """Validate feedback type."""
        if v not in ["like", "dislike"]:
            raise ValueError("feedback_type must be 'like' or 'dislike'")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "507f1f77bcf86cd799439011",
                "feedback_type": "like",
                "comment": "Very helpful advice!"
            }
        }


class UpdateSessionRequest(BaseModel):
    """Request schema for updating a chat session."""
    
    title: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="New session title"
    )
    
    @validator("title")
    def validate_title(cls, v):
        """Validate title is not empty after stripping."""
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "My Updated Training Session"
            }
        }


# ==================== RESPONSE SCHEMAS ====================

class ToolUsageResponse(BaseModel):
    """Schema for tool usage information in response."""
    
    tool_type: str
    query: str
    result_summary: Optional[str] = None
    execution_time_ms: Optional[float] = None


class SourceResponse(BaseModel):
    """Schema for source citation in response."""
    
    type: str
    title: str
    url: Optional[str] = None
    category: Optional[str] = None


class MessageMetadataResponse(BaseModel):
    """Schema for message metadata in response."""
    
    tools_used: List[ToolUsageResponse] = []
    sources: List[SourceResponse] = []
    confidence_score: Optional[float] = None
    total_processing_time_ms: Optional[float] = None
    model_version: Optional[str] = None


class RoutingInfoResponse(BaseModel):
    """Schema for routing information in response."""
    
    primary_category: str
    agents_called: List[str]
    confidence: float
    reasoning: str


class ChatMessageResponse(BaseModel):
    """Response schema for chat message."""
    
    status: str
    response: str
    session_id: str
    message_id: Optional[str] = None
    metadata: Optional[MessageMetadataResponse] = None
    routing: Optional[RoutingInfoResponse] = None
    processing_time_ms: float
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "response": "To improve your F2L speed, focus on...",
                "session_id": "507f1f77bcf86cd799439011",
                "message_id": "507f1f77bcf86cd799439012",
                "metadata": {
                    "tools_used": [
                        {
                            "tool_type": "knowledge_base",
                            "query": "F2L speed improvement",
                            "execution_time_ms": 250.5
                        }
                    ],
                    "sources": [
                        {
                            "type": "knowledge_base",
                            "title": "F2L Training Guide",
                            "category": "tutorials"
                        }
                    ],
                    "total_processing_time_ms": 1250.5,
                    "model_version": "gemini-2.5-flash"
                },
                "routing": {
                    "primary_category": "training_advice",
                    "agents_called": ["cubedev_agent", "web_search_agent"],
                    "confidence": 0.95,
                    "reasoning": "Query requests training advice"
                },
                "processing_time_ms": 1250.5,
                "timestamp": "2024-11-04T12:00:00Z"
            }
        }


class MessageResponse(BaseModel):
    """Schema for a single message."""
    
    id: str
    role: str
    content: str
    metadata: Optional[MessageMetadataResponse] = None
    created_at: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "role": "user",
                "content": "How can I improve my F2L?",
                "created_at": "2024-11-04T12:00:00Z"
            }
        }


class SessionResponse(BaseModel):
    """Schema for a chat session."""
    
    session_id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "507f1f77bcf86cd799439011",
                "user_id": "user123",
                "title": "F2L Training Discussion",
                "created_at": "2024-11-04T10:00:00Z",
                "updated_at": "2024-11-04T12:00:00Z",
                "message_count": 10
            }
        }


class SessionHistoryResponse(BaseModel):
    """Schema for session history with messages."""
    
    session: SessionResponse
    messages: List[MessageResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "session": {
                    "session_id": "507f1f77bcf86cd799439011",
                    "user_id": "user123",
                    "title": "F2L Training",
                    "created_at": "2024-11-04T10:00:00Z",
                    "updated_at": "2024-11-04T12:00:00Z"
                },
                "messages": [
                    {
                        "id": "msg1",
                        "role": "user",
                        "content": "How can I improve my F2L?",
                        "created_at": "2024-11-04T10:00:00Z"
                    },
                    {
                        "id": "msg2",
                        "role": "assistant",
                        "content": "To improve your F2L...",
                        "created_at": "2024-11-04T10:00:15Z"
                    }
                ]
            }
        }


class UserSessionsResponse(BaseModel):
    """Schema for user's session list."""
    
    sessions: List[SessionResponse]
    total: int
    limit: int
    skip: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "sessions": [
                    {
                        "session_id": "507f1f77bcf86cd799439011",
                        "user_id": "user123",
                        "title": "F2L Training",
                        "created_at": "2024-11-04T10:00:00Z",
                        "updated_at": "2024-11-04T12:00:00Z",
                        "message_count": 10
                    }
                ],
                "total": 1,
                "limit": 50,
                "skip": 0
            }
        }


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    
    status: str = "error"
    error: str
    detail: Optional[str] = None
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "error": "Invalid session ID",
                "detail": "The provided session ID does not exist",
                "timestamp": "2024-11-04T12:00:00Z"
            }
        }


class HealthResponse(BaseModel):
    """Schema for health check response."""
    
    status: str
    timestamp: str
    services: Dict[str, str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-11-04T12:00:00Z",
                "services": {
                    "database": "connected",
                    "llm": "operational",
                    "knowledge_base": "operational"
                }
            }
        }
