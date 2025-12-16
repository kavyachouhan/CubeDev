"""
Caching Manager for Cubie Backend
Provides in-memory caching with TTL for various services to reduce load
"""

from typing import Any, Optional, Callable
from datetime import datetime, timedelta
from functools import wraps
import hashlib
import json
import asyncio


class CacheEntry:
    """Cache entry with expiration."""
    
    def __init__(self, value: Any, ttl_seconds: int):
        self.value = value
        self.expires_at = datetime.now() + timedelta(seconds=ttl_seconds)
    
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


class CacheManager:
    """
    Simple in-memory cache manager with TTL support.
    Thread-safe for async operations.
    """
    
    def __init__(self):
        self._cache: dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from prefix and arguments."""
        key_data = {
            "prefix": prefix,
            "args": args,
            "kwargs": kwargs
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        async with self._lock:
            entry = self._cache.get(key)
            if entry and not entry.is_expired():
                return entry.value
            elif entry:
                # Remove expired entry
                del self._cache[key]
            return None
    
    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set value in cache with TTL (default 5 minutes)."""
        async with self._lock:
            self._cache[key] = CacheEntry(value, ttl_seconds)
    
    async def delete(self, key: str):
        """Delete specific cache entry."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    async def clear(self):
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()
    
    async def cleanup_expired(self):
        """Remove all expired entries."""
        async with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = len(self._cache)
        expired = sum(1 for entry in self._cache.values() if entry.is_expired())
        return {
            "total_entries": total,
            "active_entries": total - expired,
            "expired_entries": expired
        }


# Global cache instance
_cache_manager = CacheManager()


def get_cache_manager() -> CacheManager:
    """Get global cache manager instance."""
    return _cache_manager


def cached(prefix: str, ttl_seconds: int = 300):
    """
    Decorator to cache async function results.
    
    Args:
        prefix: Cache key prefix for this function
        ttl_seconds: Time to live in seconds (default 5 minutes)
    
    Example:
        @cached("wca_user", ttl_seconds=3600)
        async def get_user_profile(wca_id: str):
            # expensive operation
            return data
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = get_cache_manager()
            cache_key = cache._generate_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds)
            return result
        
        return wrapper
    return decorator


# Specific cache managers for different services

class WCACacheManager:
    """Cache manager for WCA API calls."""
    
    # Cache TTLs
    COMPETITION_INFO_TTL = 3600  # 1 hour
    USER_PROFILE_TTL = 1800  # 30 minutes
    RESULTS_TTL = 3600  # 1 hour
    SEARCH_TTL = 600  # 10 minutes
    
    def __init__(self, cache: CacheManager):
        self.cache = cache
    
    async def get_competition(self, competition_id: str) -> Optional[dict]:
        key = f"wca:comp:{competition_id}"
        return await self.cache.get(key)
    
    async def set_competition(self, competition_id: str, data: dict):
        key = f"wca:comp:{competition_id}"
        await self.cache.set(key, data, self.COMPETITION_INFO_TTL)
    
    async def get_user_profile(self, wca_id: str) -> Optional[dict]:
        key = f"wca:user:{wca_id}"
        return await self.cache.get(key)
    
    async def set_user_profile(self, wca_id: str, data: dict):
        key = f"wca:user:{wca_id}"
        await self.cache.set(key, data, self.USER_PROFILE_TTL)
    
    async def get_results(self, competition_id: str, event_id: Optional[str] = None) -> Optional[dict]:
        key = f"wca:results:{competition_id}:{event_id or 'all'}"
        return await self.cache.get(key)
    
    async def set_results(self, competition_id: str, event_id: Optional[str], data: dict):
        key = f"wca:results:{competition_id}:{event_id or 'all'}"
        await self.cache.set(key, data, self.RESULTS_TTL)


class RAGCacheManager:
    """Cache manager for RAG/Knowledge base queries."""
    
    RETRIEVAL_TTL = 1800  # 30 minutes
    
    def __init__(self, cache: CacheManager):
        self.cache = cache
    
    async def get_retrieval(self, query: str, top_k: int = 5) -> Optional[list]:
        key = f"rag:retrieval:{hashlib.md5(query.encode()).hexdigest()}:{top_k}"
        return await self.cache.get(key)
    
    async def set_retrieval(self, query: str, top_k: int, documents: list):
        key = f"rag:retrieval:{hashlib.md5(query.encode()).hexdigest()}:{top_k}"
        await self.cache.set(key, documents, self.RETRIEVAL_TTL)


class QueryCacheManager:
    """Cache manager for common user queries."""
    
    RESPONSE_TTL = 600  # 10 minutes for common queries
    
    def __init__(self, cache: CacheManager):
        self.cache = cache
    
    async def get_response(self, query: str, use_rag: bool = True) -> Optional[dict]:
        """Get cached response for a query."""
        key = f"query:{hashlib.md5(query.lower().strip().encode()).hexdigest()}:rag={use_rag}"
        return await self.cache.get(key)
    
    async def set_response(self, query: str, use_rag: bool, response_data: dict):
        """Cache a query response."""
        key = f"query:{hashlib.md5(query.lower().strip().encode()).hexdigest()}:rag={use_rag}"
        await self.cache.set(key, response_data, self.RESPONSE_TTL)


# Initialize service-specific cache managers
def get_wca_cache() -> WCACacheManager:
    """Get WCA cache manager."""
    return WCACacheManager(get_cache_manager())


def get_rag_cache() -> RAGCacheManager:
    """Get RAG cache manager."""
    return RAGCacheManager(get_cache_manager())


def get_query_cache() -> QueryCacheManager:
    """Get query cache manager."""
    return QueryCacheManager(get_cache_manager())
