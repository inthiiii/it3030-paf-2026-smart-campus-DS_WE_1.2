import os
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv

import os

# Load variables from .env file
load_dotenv()

app = FastAPI(title="Smart Campus AI Engine")

print("Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model Loaded Successfully!")

# Initialize Pinecone using the secure environment variable
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("smart-campus")

# --- Request Models ---
class IndexRequest(BaseModel):
    id: str        # The MongoDB ID of the resource
    text: str      # The concatenated string (Name + Type + Features)

class SearchRequest(BaseModel):
    query: str     # What the user types (e.g., "quiet room for 50 people")
    top_k: int = 3 # How many results to return

# --- Endpoints ---

@app.post("/api/index")
def index_resource(request: IndexRequest):
    """Converts resource text to a vector and saves it in Pinecone"""
    vector = model.encode(request.text).tolist()
    
    # Store in Pinecone: we use the MongoDB ID as the Pinecone Vector ID!
    index.upsert(vectors=[{"id": request.id, "values": vector}])
    return {"status": "success", "message": f"Resource {request.id} indexed in Pinecone"}

@app.post("/api/search")
def search_resources(request: SearchRequest):
    """Converts a user query to a vector and asks Pinecone for the best matches"""
    query_vector = model.encode(request.query).tolist()
    
    # Search Pinecone for the top matches
    results = index.query(vector=query_vector, top_k=request.top_k, include_metadata=False)
    
    # Extract just the IDs so Java can fetch the full details from MongoDB
    match_ids = [match['id'] for match in results['matches']]
    return {"matches": match_ids}

@app.get("/health")
def health_check():
    return {"status": "AI Engine is Online with Pinecone"}