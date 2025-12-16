"""
Authentication Middleware for Cubie Backend
Validates JWT tokens for user authentication
Supports both CubeDev JWT tokens and legacy Convex tokens
"""

from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import httpx
import os
from dotenv import load_dotenv
from app.auth.jwt_utils import verify_access_token, decode_token_without_verification

load_dotenv()

security = HTTPBearer()

CONVEX_URL = os.getenv("CONVEX_URL", "")
CONVEX_SITE_URL = os.getenv("CONVEX_SITE_URL", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")


# Cache for JWKS to avoid repeated fetches
_jwks_cache = {"data": None, "timestamp": 0}
JWKS_CACHE_TTL = 3600  # 1 hour

async def get_convex_jwks():
    """
    Fetch Convex JWKS (JSON Web Key Set) for token validation.
    Cached for performance (1 hour TTL).
    
    Returns:
        JWKS dict
    """
    import time
    
    # Check cache first
    current_time = time.time()
    if _jwks_cache["data"] and (current_time - _jwks_cache["timestamp"]) < JWKS_CACHE_TTL:
        return _jwks_cache["data"]
    
    try:
        # Convex JWKS endpoint is on the .convex.cloud domain
        # Format: https://<deployment-name>.convex.cloud/.well-known/jwks.json
        jwks_url = f"{CONVEX_URL}/.well-known/jwks.json"
        
        print(f"DEBUG: Fetching JWKS from: {jwks_url}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            jwks_data = response.json()
            print(f"DEBUG: JWKS fetched successfully, keys count: {len(jwks_data.get('keys', []))}")
            
            # Update cache
            _jwks_cache["data"] = jwks_data
            _jwks_cache["timestamp"] = current_time
            
            return jwks_data
    except Exception as e:
        print(f"Error fetching JWKS: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch authentication keys"
        )


async def verify_token(token: str) -> dict:
    """
    Verify JWT token (CubeDev tokens or Convex tokens).
    
    Args:
        token: JWT token from Authorization header
    
    Returns:
        Decoded token payload with user information
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        # Skip validation in development mode (DANGEROUS - only for local dev)
        if os.getenv("SKIP_AUTH_VALIDATION", "false").lower() == "true":
            print("WARNING: AUTH VALIDATION DISABLED - DEVELOPMENT MODE ONLY")
            return {
                "sub": "dev_user_id",
                "user_id": "dev_user_id",
                "email": "dev@example.com",
                "wca_id": "DEV2024"
            }
        
        # First, try to verify as CubeDev JWT token (production method)
        if JWT_SECRET_KEY:
            try:
                payload = verify_access_token(token)
                return {
                    "sub": payload.get("sub"),
                    "user_id": payload.get("user_id"),
                    "email": payload.get("email"),
                    "wca_id": payload.get("wca_id"),
                    "token_type": "cubedev_jwt"
                }
            except JWTError as e:
                print(f"CubeDev JWT validation failed: {e}")
                # Continue to try other methods
        
        # Fallback: Try simple base64 token (legacy method - to be deprecated)
        try:
            import base64
            import json
            decoded = base64.b64decode(token).decode('utf-8')
            payload = json.loads(decoded)
            
            # Verify it has required fields
            if 'convexId' in payload and 'timestamp' in payload:
                # Check token is not too old (24 hours)
                from datetime import datetime, timedelta
                token_time = datetime.fromtimestamp(payload['timestamp'] / 1000)
                if datetime.now() - token_time > timedelta(hours=24):
                    raise HTTPException(
                        status_code=401,
                        detail="Token expired"
                    )
                
                print(f"⚠ Legacy token verified for convexId: {payload['convexId']}")
                print("  Note: This authentication method is deprecated. Please upgrade to JWT.")
                
                # Return normalized payload
                return {
                    "sub": payload['convexId'],
                    "user_id": payload['convexId'],
                    "email": payload.get('email'),
                    "wca_id": payload.get('wcaId'),
                    "token_type": "legacy_base64"
                }
        except Exception:
            # Not a simple token, continue to Convex JWT
            pass
        
        # Fallback: Try Convex-issued JWT token
        if CONVEX_URL:
            try:
                payload = await verify_convex_jwt(token)
                print(f"✓ Convex JWT verified for user: {payload.get('sub')}")
                return payload
            except Exception as e:
                print(f"Convex JWT validation failed: {e}")
        
        # All methods failed
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token. Please sign in again."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )


async def verify_convex_jwt(token: str) -> dict:
    """
    Verify Convex-issued JWT token.
    Legacy support for Convex authentication.
    
    Args:
        token: JWT token from Convex
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        # Decode without verification first to inspect the token
        unverified_payload = jwt.get_unverified_claims(token)
        print(f"DEBUG: Token issuer: {unverified_payload.get('iss')}")
        print(f"DEBUG: Token subject: {unverified_payload.get('sub')}")
        print(f"DEBUG: Token audience: {unverified_payload.get('aud')}")
        
        # Fetch JWKS
        jwks = await get_convex_jwks()
        
        # Decode token header to get kid (key ID)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        print(f"DEBUG: Token kid: {kid}")
        print(f"DEBUG: Available kids in JWKS: {[k.get('kid') for k in jwks.get('keys', [])]}")
        
        # Find matching key in JWKS
        key = None
        for jwk_key in jwks.get("keys", []):
            if jwk_key.get("kid") == kid:
                key = jwk_key
                break
        
        if not key:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: Key not found in JWKS"
            )
        
        # Verify and decode token
        # Convex tokens have issuer as the deployment URL
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=CONVEX_URL,
            options={"verify_aud": False}  # Convex tokens may not have audience
        )
        
        print(f"DEBUG: Token verified successfully for user: {payload.get('sub')}")
        
        return {
            "sub": payload.get("sub"),
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "wca_id": payload.get("wca_id"),
            "token_type": "convex_jwt"
        }
        
    except JWTError as e:
        print(f"JWT Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid Convex token: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Convex Auth Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Convex authentication failed: {str(e)}"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Dependency to get current authenticated user.
    Verifies JWT token and returns user information.
    
    Args:
        credentials: HTTP Bearer credentials from request
    
    Returns:
        User information from token
    
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    user_info = await verify_token(token)
    
    # Extract user ID from token
    user_id = user_info.get("sub") or user_info.get("user_id")
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: User ID not found"
        )
    
    return {
        "user_id": user_id,
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "wca_id": user_info.get("wca_id"),
        "token_type": user_info.get("token_type", "unknown"),
        "token_data": user_info
    }


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[dict]:
    """
    Dependency to get current user if authenticated, None otherwise.
    Useful for endpoints that work with or without authentication.
    
    Args:
        credentials: Optional HTTP Bearer credentials
    
    Returns:
        User information or None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# Convex Query Helpers
async def query_convex_user(user_id: str) -> Optional[dict]:
    """
    Query user information from Convex.
    
    Args:
        user_id: Convex user ID
    
    Returns:
        User data from Convex or None
    """
    try:
        # This would make an actual Convex query
        # For now, return None - implement based on your Convex setup
        # You could use the Convex HTTP API or the Python client
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Example: Query Convex HTTP API
            # response = await client.post(
            #     f"{CONVEX_URL}/api/query",
            #     json={
            #         "path": "users:getById",
            #         "args": {"id": user_id}
            #     }
            # )
            # return response.json()
            pass
        
        return None
    except Exception as e:
        print(f"Error querying Convex user: {e}")
        return None


async def check_user_permissions(
    user_id: str,
    required_permissions: list[str]
) -> bool:
    """
    Check if user has required permissions.
    
    Args:
        user_id: User ID
        required_permissions: List of required permission strings
    
    Returns:
        True if user has all required permissions
    """
    # Implement permission checking logic
    # This would query Convex for user permissions
    return True  # Placeholder


# Rate limiting per user
from collections import defaultdict
from datetime import datetime, timedelta

_user_rate_limits = defaultdict(list)
RATE_LIMIT_WINDOW = timedelta(minutes=1)
RATE_LIMIT_MAX_REQUESTS = 60


async def check_rate_limit(user_id: str) -> bool:
    """
    Check if user is within rate limits.
    
    Args:
        user_id: User ID
    
    Returns:
        True if within limits
    
    Raises:
        HTTPException: If rate limit exceeded with retry_after information
    """
    now = datetime.now()
    
    # Clean old requests
    _user_rate_limits[user_id] = [
        req_time for req_time in _user_rate_limits[user_id]
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check limit
    if len(_user_rate_limits[user_id]) >= RATE_LIMIT_MAX_REQUESTS:
        # Calculate when the oldest request will expire
        oldest_request = min(_user_rate_limits[user_id])
        time_until_reset = (oldest_request + RATE_LIMIT_WINDOW - now).total_seconds()
        retry_after_seconds = max(1, int(time_until_reset))  # At least 1 second
        
        # Format the retry message with time
        if retry_after_seconds < 60:
            time_message = f"{retry_after_seconds} second{'s' if retry_after_seconds != 1 else ''}"
        else:
            minutes = retry_after_seconds // 60
            time_message = f"{minutes} minute{'s' if minutes != 1 else ''}"
        
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Please try again in {time_message}.",
            headers={"Retry-After": str(retry_after_seconds)}
        )
    
    # Add current request
    _user_rate_limits[user_id].append(now)
    
    return True
