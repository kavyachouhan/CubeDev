"""
Setup script for Cubie AI Backend
Run this after installation to verify configuration and setup
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import asyncio

def check_env_file():
    """Check if .env file exists."""
    if not Path(".env").exists():
        print("❌ .env file not found!")
        print("   Please copy .env.example to .env and configure it:")
        print("   cp .env.example .env")
        return False
    print("✅ .env file found")
    return True

def check_required_vars():
    """Check if required environment variables are set."""
    load_dotenv()
    
    required_vars = [
        "MONGODB_URI",
        "MONGODB_DB_NAME",
        "GEMINI_API_KEY",
        "CONVEX_URL",
        "TAVILY_API_KEY"
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith("your_"):
            missing.append(var)
            print(f"❌ {var} not configured")
        else:
            print(f"✅ {var} configured")
    
    if missing:
        print(f"\n❌ Missing configuration for: {', '.join(missing)}")
        print("   Please update your .env file with actual values")
        return False
    
    return True

async def check_mongodb():
    """Check MongoDB connection."""
    try:
        from pymongo import MongoClient
        
        load_dotenv()
        client = MongoClient(os.getenv("MONGODB_URI"), serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Check if collections exist
        db = client[os.getenv("MONGODB_DB_NAME")]
        collections = db.list_collection_names()
        print(f"   Found {len(collections)} collections")
        
        client.close()
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

async def check_gemini():
    """Check Gemini API connection."""
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        load_dotenv()
        llm = ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL"),
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        
        response = await llm.ainvoke("Hello")
        print("✅ Gemini API connection successful")
        return True
    except Exception as e:
        print(f"❌ Gemini API connection failed: {e}")
        return False

async def check_tavily():
    """Check Tavily API connection."""
    try:
        from langchain_tavily import TavilySearch
        
        load_dotenv()
        search = TavilySearch(max_results=1)
        results = await search.ainvoke({"query": "test"})
        print("✅ Tavily API connection successful")
        return True
    except Exception as e:
        print(f"❌ Tavily API connection failed: {e}")
        return False

def check_directory_structure():
    """Check if all required directories exist."""
    required_dirs = [
        "app/agents",
        "app/auth",
        "app/db",
        "app/memory",
        "app/models",
        "app/orchestrator",
        "app/rag",
        "app/schemas"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"✅ {dir_path}")
        else:
            print(f"❌ {dir_path} missing")
            all_exist = False
    
    return all_exist

async def run_checks():
    """Run all setup checks."""
    print("=" * 60)
    print("Cubie AI Backend - Setup Verification")
    print("=" * 60)
    
    print("\n📁 Checking directory structure...")
    dir_ok = check_directory_structure()
    
    print("\n📄 Checking environment configuration...")
    env_ok = check_env_file()
    
    if not env_ok:
        print("\n❌ Setup incomplete. Please configure .env file first.")
        return False
    
    print("\n🔑 Checking required variables...")
    vars_ok = check_required_vars()
    
    if not vars_ok:
        print("\n❌ Setup incomplete. Please configure all required variables.")
        return False
    
    print("\n🔌 Testing external connections...")
    mongo_ok = await check_mongodb()
    gemini_ok = await check_gemini()
    tavily_ok = await check_tavily()
    
    print("\n" + "=" * 60)
    
    if dir_ok and env_ok and vars_ok and mongo_ok and gemini_ok and tavily_ok:
        print("✅ All checks passed! You're ready to run Cubie AI Backend.")
        print("\nTo start the server, run:")
        print("   python main.py")
        print("\nAPI Documentation will be available at:")
        print("   http://localhost:8000/docs")
        return True
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        return False

def main():
    """Main setup function."""
    try:
        success = asyncio.run(run_checks())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Setup failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
