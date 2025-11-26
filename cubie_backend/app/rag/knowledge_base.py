"""
CubeDev Knowledge Base with RAG (Retrieval-Augmented Generation)
Uses MongoDB Atlas Vector Search for semantic retrieval
"""

from typing import List, Dict, Any, Optional
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStoreRetriever
from pymongo.database import Database
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()


class CubeDevKnowledgeBase:
    """
    CubeDev Knowledge Base using MongoDB Atlas Vector Search.
    Stores and retrieves cubing knowledge, algorithms, tutorials, and resources.
    """
    
    def __init__(
        self,
        mongodb_uri: str,
        db_name: str,
        collection_name: str = "knowledge_base",
        index_name: str = "vector_index"
    ):
        """
        Initialize the knowledge base.
        
        Args:
            mongodb_uri: MongoDB connection URI (Atlas with Vector Search)
            db_name: Database name
            collection_name: Collection name for knowledge base
            index_name: Name of the vector search index
        """
        self.mongodb_uri = mongodb_uri
        self.db_name = db_name
        self.collection_name = collection_name
        self.index_name = index_name
        
        # Initialize embeddings with Google Generative AI
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        
        # Initialize MongoDB client
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        
        # Initialize vector store
        self._init_vector_store()
    
    def _init_vector_store(self):
        """Initialize the MongoDB Atlas Vector Search store."""
        self.vector_store = MongoDBAtlasVectorSearch(
            collection=self.collection,
            embedding=self.embeddings,
            index_name=self.index_name,
            text_key="text",
            embedding_key="embedding"
        )
    
    def get_retriever(
        self,
        search_type: str = "similarity",
        search_kwargs: Optional[Dict[str, Any]] = None
    ) -> VectorStoreRetriever:
        """
        Get a retriever for the knowledge base.
        
        Args:
            search_type: Type of search ("similarity", "mmr", "similarity_score_threshold")
            search_kwargs: Additional search parameters
        
        Returns:
            VectorStoreRetriever instance
        """
        if search_kwargs is None:
            search_kwargs = {"k": 5}
        
        return self.vector_store.as_retriever(
            search_type=search_type,
            search_kwargs=search_kwargs
        )
    
    async def add_documents(
        self,
        documents: List[Document],
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Add documents to the knowledge base.
        
        Args:
            documents: List of Document objects to add
            ids: Optional list of IDs for the documents
        
        Returns:
            List of document IDs
        """
        return await self.vector_store.aadd_documents(documents, ids=ids)
    
    async def add_texts(
        self,
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Add texts to the knowledge base.
        
        Args:
            texts: List of text strings to add
            metadatas: Optional list of metadata dicts
            ids: Optional list of IDs
        
        Returns:
            List of document IDs
        """
        return await self.vector_store.aadd_texts(
            texts=texts,
            metadatas=metadatas,
            ids=ids
        )
    
    async def similarity_search(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Perform similarity search.
        
        Args:
            query: Search query
            k: Number of results to return
            filter: Optional metadata filter
        
        Returns:
            List of relevant Documents
        """
        return await self.vector_store.asimilarity_search(
            query=query,
            k=k,
            filter=filter
        )
    
    async def similarity_search_with_score(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[tuple[Document, float]]:
        """
        Perform similarity search with relevance scores.
        
        Args:
            query: Search query
            k: Number of results to return
            filter: Optional metadata filter
        
        Returns:
            List of (Document, score) tuples
        """
        return await self.vector_store.asimilarity_search_with_score(
            query=query,
            k=k,
            filter=filter
        )
    
    async def max_marginal_relevance_search(
        self,
        query: str,
        k: int = 5,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Perform MMR search for diverse results.
        
        Args:
            query: Search query
            k: Number of results to return
            fetch_k: Number of documents to fetch before MMR
            lambda_mult: Diversity parameter (0=max diversity, 1=max relevance)
            filter: Optional metadata filter
        
        Returns:
            List of diverse relevant Documents
        """
        return await self.vector_store.amax_marginal_relevance_search(
            query=query,
            k=k,
            fetch_k=fetch_k,
            lambda_mult=lambda_mult,
            filter=filter
        )
    
    async def delete_documents(self, ids: List[str]) -> bool:
        """
        Delete documents from the knowledge base.
        
        Args:
            ids: List of document IDs to delete
        
        Returns:
            True if deletion successful
        """
        try:
            await self.vector_store.adelete(ids)
            return True
        except Exception as e:
            print(f"Error deleting documents: {e}")
            return False
    
    def close(self):
        """Close the MongoDB connection."""
        self.client.close()


class KnowledgeBaseManager:
    """
    Manager for CubeDev Knowledge Base operations.
    Handles document ingestion, updates, and retrieval.
    """
    
    def __init__(self, knowledge_base: CubeDevKnowledgeBase):
        """
        Initialize the manager.
        
        Args:
            knowledge_base: CubeDevKnowledgeBase instance
        """
        self.kb = knowledge_base
    
    async def ingest_cubing_knowledge(
        self,
        knowledge_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Ingest cubing knowledge into the knowledge base.
        
        Args:
            knowledge_items: List of knowledge items with structure:
                {
                    "title": "Item title",
                    "content": "Main content",
                    "category": "algorithms|tutorials|methods|tips|faq",
                    "subcategory": "CFOP|Roux|F2L|OLL|PLL|etc",
                    "difficulty": "beginner|intermediate|advanced",
                    "tags": ["tag1", "tag2"],
                    "source": "source URL or reference"
                }
        
        Returns:
            Dict with ingestion statistics
        """
        documents = []
        
        for item in knowledge_items:
            # Create document text
            text = f"Title: {item.get('title', '')}\n\n{item.get('content', '')}"
            
            # Create metadata
            metadata = {
                "title": item.get("title", ""),
                "category": item.get("category", ""),
                "subcategory": item.get("subcategory", ""),
                "difficulty": item.get("difficulty", ""),
                "tags": item.get("tags", []),
                "source": item.get("source", ""),
                "type": "cubing_knowledge"
            }
            
            documents.append(Document(page_content=text, metadata=metadata))
        
        try:
            doc_ids = await self.kb.add_documents(documents)
            
            return {
                "status": "success",
                "documents_added": len(doc_ids),
                "document_ids": doc_ids
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def query_knowledge(
        self,
        query: str,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        k: int = 5,
        use_mmr: bool = True
    ) -> Dict[str, Any]:
        """
        Query the knowledge base.
        
        Args:
            query: User query
            category: Optional category filter
            difficulty: Optional difficulty filter
            k: Number of results
            use_mmr: Whether to use MMR for diverse results
        
        Returns:
            Dict with query results and metadata
        """
        # Build filter
        filter_dict = {}
        if category:
            filter_dict["category"] = category
        if difficulty:
            filter_dict["difficulty"] = difficulty
        
        try:
            if use_mmr:
                # Use MMR for diverse results
                results = await self.kb.max_marginal_relevance_search(
                    query=query,
                    k=k,
                    filter=filter_dict if filter_dict else None
                )
                
                return {
                    "status": "success",
                    "query": query,
                    "results": [
                        {
                            "content": doc.page_content,
                            "metadata": doc.metadata
                        }
                        for doc in results
                    ],
                    "result_count": len(results),
                    "search_type": "mmr"
                }
            else:
                # Use similarity search with scores
                results = await self.kb.similarity_search_with_score(
                    query=query,
                    k=k,
                    filter=filter_dict if filter_dict else None
                )
                
                return {
                    "status": "success",
                    "query": query,
                    "results": [
                        {
                            "content": doc.page_content,
                            "metadata": doc.metadata,
                            "score": score
                        }
                        for doc, score in results
                    ],
                    "result_count": len(results),
                    "search_type": "similarity_with_score"
                }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def get_algorithm_set(
        self,
        algorithm_set: str,
        case: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get algorithms for a specific set (OLL, PLL, F2L, etc.).
        
        Args:
            algorithm_set: Algorithm set name (OLL, PLL, CMLL, etc.)
            case: Optional specific case within the set
        
        Returns:
            Dict with algorithm information
        """
        query = f"{algorithm_set} algorithms"
        if case:
            query += f" case {case}"
        
        return await self.query_knowledge(
            query=query,
            category="algorithms",
            k=10 if not case else 3
        )
    
    async def get_method_guide(
        self,
        method: str,
        difficulty: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get method guide/tutorial.
        
        Args:
            method: Method name (CFOP, Roux, ZZ, etc.)
            difficulty: Optional difficulty level
        
        Returns:
            Dict with method guide information
        """
        query = f"{method} method guide tutorial"
        
        return await self.query_knowledge(
            query=query,
            category="methods",
            difficulty=difficulty,
            k=5
        )
    
    async def get_training_tips(
        self,
        topic: str,
        difficulty: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get training tips for a specific topic.
        
        Args:
            topic: Training topic (look-ahead, fingertricks, etc.)
            difficulty: Optional difficulty level
        
        Returns:
            Dict with training tips
        """
        query = f"{topic} training tips practice"
        
        return await self.query_knowledge(
            query=query,
            category="tips",
            difficulty=difficulty,
            k=5
        )


# Initialize global knowledge base instance
_kb_instance = None


def get_knowledge_base() -> CubeDevKnowledgeBase:
    """
    Get or create the global knowledge base instance.
    
    Returns:
        CubeDevKnowledgeBase instance
    """
    global _kb_instance
    
    if _kb_instance is None:
        _kb_instance = CubeDevKnowledgeBase(
            mongodb_uri=os.getenv("MONGODB_URI"),
            db_name=os.getenv("MONGODB_DB_NAME"),
            collection_name="knowledge_base",
            index_name="vector_index"
        )
    
    return _kb_instance


def get_knowledge_manager() -> KnowledgeBaseManager:
    """
    Get knowledge base manager.
    
    Returns:
        KnowledgeBaseManager instance
    """
    return KnowledgeBaseManager(get_knowledge_base())
