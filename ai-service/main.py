import os
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.ensemble import RandomForestClassifier

import os
import numpy as np

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

# --- MODULE E: Suspicious Login Detection (Anomaly AI) ---

# In-memory storage for user login times (converted to decimal hours: 0.0 - 23.99)
# In a real enterprise app, you would fetch this history from MongoDB!
user_login_history = {}

class LoginRequest(BaseModel):
    email: str
    timestamp: str # ISO format string

@app.post("/api/anomaly/login")
def check_suspicious_login(request: LoginRequest):
    email = request.email
    
    # Parse the timestamp to a decimal hour (e.g., 14:30 -> 14.5)
    dt = datetime.fromisoformat(request.timestamp.replace("Z", "+00:00"))
    login_hour = dt.hour + (dt.minute / 60.0)

    # If this is a new user, give them a "baseline" normal schedule (9 AM - 5 PM)
    # This prevents the AI from crashing on their very first login
    if email not in user_login_history:
        user_login_history[email] = [9.0, 9.5, 10.0, 14.0, 16.0, 17.0] # [1.0, 1.5, 2.0, 3.0, 4.0]

    history = user_login_history[email]

    # Reshape the data for the AI Model
    X = np.array(history).reshape(-1, 1)
    
    # Train the Isolation Forest Model
    # contamination=0.1 means we expect roughly 10% of logins to be weird/outliers
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X)

    # Test the current login time against the learned model
    current_login = np.array([[login_hour]])
    prediction = model.predict(current_login) # returns 1 for normal, -1 for anomaly
    
    is_suspicious = bool(prediction[0] == -1)

    # Add this current login to their history so the AI gets smarter next time!
    history.append(login_hour)

    return {
        "email": email,
        "login_hour": round(login_hour, 2),
        "is_suspicious": is_suspicious
    }

# --- END MODULE E ---



# --- MODULE B: Autonomous No-Show Prediction ---

# 1. Train the Predictive Model on Startup
print("Training No-Show Prediction Model...")
# Features: [past_no_show_rate (0.0-1.0), hour_of_day (0-23), duration_in_hours]
# Labels: 1 (No-Show), 0 (Showed Up)
X_train = np.array([
    [0.0, 10, 1], [0.8, 18, 3], [0.1, 14, 2], [0.5, 8, 1],
    [0.0, 9, 2], [0.9, 20, 4], [0.2, 11, 1], [0.7, 16, 3]
])
y_train = np.array([0, 1, 0, 0, 0, 1, 0, 1])

rf_model = RandomForestClassifier(n_estimators=10, random_state=42)
rf_model.fit(X_train, y_train)
print("Prediction Model Ready!")

class PredictionRequest(BaseModel):
    past_no_show_rate: float
    hour_of_day: float
    duration_hours: float

@app.post("/api/predict/no-show")
def predict_no_show(request: PredictionRequest):
    # Format the incoming data for the model
    features = np.array([[request.past_no_show_rate, request.hour_of_day, request.duration_hours]])
    
    # Predict probability of class 1 (No-Show)
    probability = rf_model.predict_proba(features)[0][1]
    risk_percentage = round(probability * 100, 2)

    return {
        "risk_score": risk_percentage,
        "auto_approve": bool(risk_percentage < 40.0) # If risk is under 40%, let the AI approve it!
    }
    
# --- END MODULE B ---
    
