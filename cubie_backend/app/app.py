from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from typing import Optional
import os
from datetime import datetime
from dotenv import load_dotenv

# Import services and dependencies
from app.db.connection import db
from app.db.chat_service import ChatService
from app.orchestrator.cubie_orchestrator import get_orchestrator, CubieOrchestrator
from app.auth.convex_auth import get_current_user, get_optional_user, check_rate_limit
from app.schemas.chat_schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    NewSessionRequest,
    SessionResponse,
    SessionHistoryResponse,
    UserSessionsResponse,
    MessageFeedbackRequest,
    UpdateSessionRequest,
    ErrorResponse,
    HealthResponse,
    MessageMetadataResponse,
    RoutingInfoResponse
)
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.utils.cache_manager import get_cache_manager, get_wca_cache, get_rag_cache, get_query_cache

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Cubie AI Backend API",
    description="Agentic RAG system for speedcubing assistance on CubeDev platform",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    # The exc.detail from slowapi contains rate limit config like "1 per 1 minute"
    # We need to parse and provide a better user-friendly message
    detail = str(exc.detail) if exc.detail else ""
    
    # Calculate retry-after time (default to 60 seconds for per-minute limits)
    retry_seconds = 60
    
    # Try to extract time from the detail string
    if "minute" in detail.lower():
        retry_seconds = 60
    elif "hour" in detail.lower():
        retry_seconds = 3600
    elif "second" in detail.lower():
        # Try to extract number of seconds
        import re
        match = re.search(r'(\d+)\s*per\s*(\d+)\s*second', detail.lower())
        if match:
            retry_seconds = int(match.group(2))
    
    # Format user-friendly message
    if retry_seconds < 60:
        time_message = f"{retry_seconds} second{'s' if retry_seconds != 1 else ''}"
    else:
        minutes = retry_seconds // 60
        time_message = f"{minutes} minute{'s' if minutes != 1 else ''}"
    
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Limit exceeded. Please try again in {time_message}.",
            "retry_after": str(retry_seconds)
        }
    )

# Initialize cache managers
cache_manager = get_cache_manager()
wca_cache = get_wca_cache()
rag_cache = get_rag_cache()
query_cache = get_query_cache()

# Initialize services
chat_service = ChatService(db)


# ==================== HEALTH & STATUS ====================

@app.get("/")
@limiter.limit("20/minute")
async def read_root(request: Request):
    """Root endpoint."""
    return {
        "service": "Cubie AI Backend",
        "version": "2.0.0",
        "status": "operational",
        "documentation": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
@limiter.limit("30/minute")
async def health_check(request: Request):
    """Health check endpoint."""
    try:
        # Check database connection
        db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        timestamp=datetime.now().isoformat(),
        services={
            "database": db_status,
            "llm": "operational",
            "knowledge_base": "operational"
        }
    )


# ==================== CHAT ENDPOINTS ====================

@app.post("/chat", response_model=ChatMessageResponse)
@limiter.limit("3/minute")
async def send_message(
    request: Request,
    chat_request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to Cubie AI and get a response.
    
    This endpoint:
    1. Authenticates the user via Convex JWT
    2. Creates a new session or uses existing one
    3. Processes the query through the agentic RAG system
    4. Returns the AI response with metadata or streams it
    5. Uses caching for common queries to reduce load
    
    Rate limit: 3 requests per minute per user
    """
    try:
        user_id = current_user["user_id"]
        
        # Check rate limit
        await check_rate_limit(user_id)
        
        # Get orchestrator
        orchestrator = get_orchestrator(chat_service)
        
        # Create new session if not provided
        if not chat_request.session_id:
            session_info = await orchestrator.create_new_session(user_id)
            session_id = session_info["session_id"]
        else:
            session_id = chat_request.session_id
            
            # Verify session belongs to user
            session = chat_service.get_session(session_id)
            if not session or session.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found or access denied"
                )
        
        # Handle streaming response
        if chat_request.stream:
            from fastapi.responses import StreamingResponse
            import json
            
            async def generate_stream():
                """Generate streaming response"""
                try:
                    # Process query with streaming
                    async for chunk in orchestrator.process_query_stream(
                        user_query=chat_request.message,
                        user_id=user_id,
                        session_id=session_id,
                        use_rag=chat_request.use_rag
                    ):
                        # Send each chunk as JSON
                        yield f"data: {json.dumps(chunk)}\n\n"
                    
                    # Send final done message
                    yield f"data: {json.dumps({'status': 'done'})}\n\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        # Non-streaming response
        result = await orchestrator.process_query(
            user_query=chat_request.message,
            user_id=user_id,
            session_id=session_id,
            use_rag=chat_request.use_rag,
            stream=False
        )
        
        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to process query")
            )
        
        # Get the bot message ID (most recent message in session)
        messages = chat_service.get_recent_messages(session_id, count=1)
        message_id = str(messages[0].id) if messages else None
        
        # Format metadata
        metadata = None
        if result.get("metadata"):
            metadata = MessageMetadataResponse(**result["metadata"])
        
        # Format routing info
        routing = None
        if result.get("routing"):
            routing = RoutingInfoResponse(**result["routing"])
        
        return ChatMessageResponse(
            status="success",
            response=result["response"],
            session_id=session_id,
            message_id=message_id,
            metadata=metadata,
            routing=routing,
            processing_time_ms=result["processing_time_ms"],
            timestamp=result["timestamp"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@app.post("/chat/session", response_model=SessionResponse)
@limiter.limit("20/minute")
async def create_session(
    request: Request,
    session_request: NewSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new chat session.
    
    Optionally provide an initial message to start the conversation.
    Rate limit: 20 sessions per minute per IP
    """
    try:
        user_id = current_user["user_id"]
        orchestrator = get_orchestrator(chat_service)
        
        session_info = await orchestrator.create_new_session(
            user_id=user_id,
            initial_message=session_request.initial_message
        )
        
        # If initial message provided, process it
        if session_request.initial_message:
            await orchestrator.process_query(
                user_query=session_request.initial_message,
                user_id=user_id,
                session_id=session_info["session_id"],
                use_rag=True,
                stream=False
            )
        
        # Update title if provided
        if session_request.title:
            chat_service.update_session(
                session_id=session_info["session_id"],
                title=session_request.title
            )
            session_info["title"] = session_request.title
        
        return SessionResponse(**session_info)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@app.get("/chat/sessions", response_model=UserSessionsResponse)
@limiter.limit("30/minute")
async def get_user_sessions(
    request: Request,
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all chat sessions for the current user.
    
    Returns sessions ordered by last updated (most recent first).
    Rate limit: 30 requests per minute per IP
    """
    try:
        user_id = current_user["user_id"]
        
        sessions = chat_service.get_user_sessions(
            user_id=user_id,
            limit=limit,
            skip=skip
        )
        
        session_responses = []
        for session in sessions:
            stats = chat_service.get_session_stats(str(session.id))
            
            session_responses.append(SessionResponse(
                session_id=str(session.id),
                user_id=session.user_id,
                title=session.title,
                created_at=session.created_at.isoformat(),
                updated_at=session.updated_at.isoformat(),
                message_count=stats.get("total_messages", 0)
            ))
        
        return UserSessionsResponse(
            sessions=session_responses,
            total=len(session_responses),
            limit=limit,
            skip=skip
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )


@app.get("/chat/session/{session_id}", response_model=SessionHistoryResponse)
@limiter.limit("30/minute")
async def get_session_history(
    request: Request,
    session_id: str,
    limit: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get full history for a specific chat session.
    
    Returns session details and all messages.
    Rate limit: 30 requests per minute per IP
    """
    try:
        user_id = current_user["user_id"]
        
        # Verify session belongs to user
        session = chat_service.get_session(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Get messages
        orchestrator = get_orchestrator(chat_service)
        messages = await orchestrator.get_session_history(session_id, limit)
        
        # Get stats
        stats = chat_service.get_session_stats(session_id)
        
        from app.schemas.chat_schemas import MessageResponse
        
        return SessionHistoryResponse(
            session=SessionResponse(
                session_id=str(session.id),
                user_id=session.user_id,
                title=session.title,
                created_at=session.created_at.isoformat(),
                updated_at=session.updated_at.isoformat(),
                message_count=stats.get("total_messages", 0)
            ),
            messages=[MessageResponse(**msg) for msg in messages]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session history: {str(e)}"
        )


@app.delete("/chat/session/{session_id}")
@limiter.limit("15/minute")
async def delete_session(
    request: Request,
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a chat session and all its messages.
    Rate limit: 15 requests per minute per IP
    """
    try:
        user_id = current_user["user_id"]
        
        # Verify session belongs to user
        session = chat_service.get_session(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Delete session
        success = chat_service.delete_session(session_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete session"
            )
        
        return {"status": "success", "message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )


@app.put("/chat/session/{session_id}", response_model=SessionResponse)
@limiter.limit("20/minute")
async def update_session(
    request: Request,
    session_id: str,
    update_request: UpdateSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a chat session (e.g., change title).
    Rate limit: 20 requests per minute per IP
    """
    try:
        user_id = current_user["user_id"]
        
        # Verify session belongs to user
        session = chat_service.get_session(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Update session
        success = chat_service.update_session(session_id, title=update_request.title)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update session"
            )
        
        # Get updated session
        updated_session = chat_service.get_session(session_id)
        stats = chat_service.get_session_stats(session_id)
        
        return SessionResponse(
            session_id=str(updated_session.id),
            user_id=updated_session.user_id,
            title=updated_session.title,
            created_at=updated_session.created_at.isoformat(),
            updated_at=updated_session.updated_at.isoformat(),
            message_count=stats.get("total_messages", 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update session: {str(e)}"
        )


@app.post("/chat/feedback")
@limiter.limit("30/minute")
async def submit_feedback(
    request: Request,
    feedback_request: MessageFeedbackRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit feedback for a bot message.
    Rate limit: 30 requests per minute per IP
    """
    try:
        from app.models.chat import MessageFeedback, FeedbackType
        
        # Get message and verify access
        message = chat_service.get_message(feedback_request.message_id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        if message.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Create feedback
        feedback = MessageFeedback(
            feedback_type=FeedbackType(feedback_request.feedback_type),
            comment=feedback_request.comment
        )
        
        # Update message
        success = chat_service.update_message_feedback(
            message_id=feedback_request.message_id,
            feedback=feedback
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit feedback"
            )
        
        return {"status": "success", "message": "Feedback submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        )
