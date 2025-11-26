from pymongo import MongoClient
from pymongo.database import Database
import os
from dotenv import load_dotenv

load_dotenv()

def get_database() -> Database:
    client = MongoClient(os.getenv("MONGODB_URI"))
    return client[os.getenv("MONGODB_DB_NAME")]

db = get_database()