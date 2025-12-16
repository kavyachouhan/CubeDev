"""
JWT Utilities for CubeDev Backend
Handles JWT token generation and validation for production use
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ISSUER = "cubedev"
JWT_AUDIENCE = "cubie-backend"
JWT_EXPIRATION_HOURS = 24  # Token valid for 24 hours


def generate_jwt_secret() -> str:
    """
    Generate a secure random secret key for JWT signing.
    Use this to generate a new secret for production.
    
    Returns:
        Secure random string (64 characters)
    """
    return secrets.token_urlsafe(64)


def create_access_token(
    user_id: str,
    wca_id: str,
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token for a user.
    
    Args:
        user_id: User's Convex ID
        wca_id: User's WCA ID
        email: User's email (optional)
        expires_delta: Custom expiration time (optional)
    
    Returns:
        JWT token string
    
    Raises:
        ValueError: If JWT_SECRET_KEY is not configured
    """
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY must be configured in environment variables")
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    # Create token payload
    payload: Dict[str, Any] = {
        "sub": user_id,  # Subject (user identifier)
        "user_id": user_id,
        "wca_id": wca_id,
        "iss": JWT_ISSUER,  # Issuer
        "aud": JWT_AUDIENCE,  # Audience
        "iat": datetime.utcnow(),  # Issued at
        "exp": expire,  # Expiration time
    }
    
    # Add email if provided
    if email:
        payload["email"] = email
    
    # Encode JWT
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return token


def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT access token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        JWTError: If token is invalid or expired
        ValueError: If JWT_SECRET_KEY is not configured
    """
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY must be configured in environment variables")
    
    try:
        # Decode and verify token
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": True,
            }
        )
        
        return payload
        
    except JWTError as e:
        raise JWTError(f"Token validation failed: {str(e)}")


def decode_token_without_verification(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT token without verification.
    Useful for inspecting token contents without validating signature.
    WARNING: Do not use for authentication - only for debugging/inspection.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload or None if decoding fails
    """
    try:
        payload = jwt.get_unverified_claims(token)
        return payload
    except Exception as e:
        print(f"Error decoding token: {e}")
        return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired without full verification.
    
    Args:
        token: JWT token string
    
    Returns:
        True if expired, False if still valid
    """
    try:
        payload = jwt.get_unverified_claims(token)
        exp = payload.get("exp")
        
        if not exp:
            return True
        
        return datetime.fromtimestamp(exp) < datetime.utcnow()
        
    except Exception:
        return True


def refresh_token(old_token: str) -> str:
    """
    Refresh an existing token if it's still valid.
    Creates a new token with the same claims but extended expiration.
    
    Args:
        old_token: Existing JWT token
    
    Returns:
        New JWT token with extended expiration
    
    Raises:
        JWTError: If old token is invalid
    """
    # Verify old token
    payload = verify_access_token(old_token)
    
    # Create new token with same user info
    new_token = create_access_token(
        user_id=payload["user_id"],
        wca_id=payload["wca_id"],
        email=payload.get("email")
    )
    
    return new_token


# Example usage and testing
if __name__ == "__main__":
    # Generate a new secret key
    print("Generate a new JWT secret key for production:")
    print(generate_jwt_secret())
    print()
    
    # Test token creation and verification (requires JWT_SECRET_KEY to be set)
    if JWT_SECRET_KEY:
        print("Testing JWT token creation and verification...")
        
        # Create a test token
        test_token = create_access_token(
            user_id="test_user_123",
            wca_id="2024TEST01",
            email="test@example.com"
        )
        print(f"Created token: {test_token[:50]}...")
        
        # Verify token
        try:
            decoded = verify_access_token(test_token)
            print(f"Token verified successfully!")
            print(f"User ID: {decoded['user_id']}")
            print(f"WCA ID: {decoded['wca_id']}")
            print(f"Expires: {datetime.fromtimestamp(decoded['exp'])}")
        except JWTError as e:
            print(f"Token verification failed: {e}")
    else:
        print("JWT_SECRET_KEY not configured - skipping tests")
