import os
import json
import base64
import io
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image

from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.ensemble import RandomForestClassifier

import os
import numpy as np

# Load variables from .env file
load_dotenv()

app = FastAPI(title="Smart Campus AI Engine")

# Allow React frontend to call this service directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Existing: Sentence Transformer for semantic search ---
print("Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model Loaded Successfully!")

# --- Existing: Pinecone for vector search ---
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("smart-campus")

# --- NEW: Google Gemini Vision ---
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
vision_model = genai.GenerativeModel("gemini-2.5-flash")

# --- Existing Request Models ---
class IndexRequest(BaseModel):
    id: str
    text: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 3

# --- NEW: Damage Assessment Request Model ---
class DamageAssessmentRequest(BaseModel):
    imageBase64: str   # The full data URL: "data:image/jpeg;base64,/9j/..."
    title: str = ""    # Ticket title for extra context
    description: str = ""  # Ticket description for extra context

# --- Existing Endpoints ---

@app.post("/api/index")
def index_resource(request: IndexRequest):
    vector = model.encode(request.text).tolist()
    index.upsert(vectors=[{"id": request.id, "values": vector}])
    return {"status": "success", "message": f"Resource {request.id} indexed"}

@app.post("/api/search")
def search_resources(request: SearchRequest):
    query_vector = model.encode(request.query).tolist()
    results = index.query(vector=query_vector, top_k=request.top_k, include_metadata=False)
    match_ids = [match['id'] for match in results['matches']]
    return {"matches": match_ids}

@app.get("/health")
def health_check():
    return {"status": "AI Engine is Online"}

# --- NEW: Damage Assessment Endpoint ---

@app.post("/api/analyze-damage")
def analyze_damage(request: DamageAssessmentRequest):
    """
    Uses Gemini Vision to analyze an image of campus damage and return:
    - faultCategory: what type of equipment/facility is broken
    - severity: how bad the damage is
    - priorityLevel: 1 (critical) to 4 (low)
    - assignedTechnicianRole: what type of technician should handle it
    - summary: a short description of the damage
    """
    try:
        # Strip the data URL prefix to get raw base64 bytes
        # imageBase64 looks like: "data:image/jpeg;base64,/9j/..."
        if "," in request.imageBase64:
            raw_base64 = request.imageBase64.split(",")[1]
            mime_type = request.imageBase64.split(";")[0].replace("data:", "")
        else:
            raw_base64 = request.imageBase64
            mime_type = "image/jpeg"

        image_bytes = base64.b64decode(raw_base64)

        # Build the prompt for Gemini
        prompt = f"""
You are a campus facilities damage assessment AI.

Analyze the provided image of damaged campus equipment or facilities.
Also consider this context:
- Ticket Title: "{request.title}"
- Ticket Description: "{request.description}"

Respond ONLY with a valid JSON object in this exact format, no extra text:
{{
  "faultCategory": "one of: ELECTRICAL, PLUMBING, FURNITURE, AV_EQUIPMENT, IT_HARDWARE, STRUCTURAL, HVAC, OTHER",
  "severity": "one of: LOW, MEDIUM, HIGH, CRITICAL",
  "priorityLevel": "integer 1 (highest/critical) to 4 (lowest)",
  "assignedTechnicianRole": "one of: ELECTRICIAN, PLUMBER, FURNITURE_TECHNICIAN, AV_TECHNICIAN, IT_TECHNICIAN, STRUCTURAL_ENGINEER, HVAC_TECHNICIAN, GENERAL_MAINTENANCE",
  "summary": "2-3 sentence description of the damage and recommended action"
}}

Rules:
- CRITICAL/priority 1 = immediate safety risk (electrical sparks, flooding, structural collapse)
- HIGH/priority 2 = significant disruption to learning (projector down in lecture hall, broken lab equipment)
- MEDIUM/priority 3 = inconvenient but workaround exists (broken furniture, minor leak)
- LOW/priority 4 = cosmetic or minor issue (scratches, worn paint)
"""

        # Convert bytes to PIL Image — works with all SDK versions
        pil_image = Image.open(io.BytesIO(image_bytes))

        # Call Gemini Vision
        response = vision_model.generate_content([prompt, pil_image])

        # Parse the JSON response from Gemini
        raw_text = response.text.strip()

        # Handle if Gemini wraps in markdown code block
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        result = json.loads(raw_text)

        # Validate required fields exist
        result.setdefault("faultCategory", "OTHER")
        result.setdefault("severity", "MEDIUM")
        result.setdefault("priorityLevel", 3)
        result.setdefault("assignedTechnicianRole", "GENERAL_MAINTENANCE")
        result.setdefault("summary", "Damage assessment completed.")

        return {"status": "success", "assessment": result}

    except Exception as e:
        import traceback
        print(f"Gemini analysis error: {type(e).__name__}: {e}")
        traceback.print_exc()
        # Graceful fallback — never block ticket creation
        return {
            "status": "fallback",
            "assessment": {
                "faultCategory": "OTHER",
                "severity": "MEDIUM",
                "priorityLevel": 3,
                "assignedTechnicianRole": "GENERAL_MAINTENANCE",
                "summary": "Automated assessment unavailable. Manual review required."
            }
        }

# --- NEW: Resolution Steps Endpoint ---

class ResolutionStepsRequest(BaseModel):
    faultCategory: str = "OTHER"
    severity: str = "MEDIUM"
    title: str = ""
    description: str = ""
    location: str = ""
    assignedTechnicianRole: str = "GENERAL_MAINTENANCE"

@app.post("/api/resolution-steps")
def get_resolution_steps(request: ResolutionStepsRequest):
    """
    Uses Gemini to generate step-by-step resolution instructions
    for a campus maintenance ticket.
    """
    try:
        prompt = f"""
You are an expert campus facilities maintenance advisor.

A maintenance ticket has been reported with the following details:
- Title: "{request.title}"
- Description: "{request.description}"
- Location: "{request.location}"
- Fault Category: "{request.faultCategory}"
- Severity: "{request.severity}"
- Assigned Technician Role: "{request.assignedTechnicianRole}"

Generate a clear, practical, numbered step-by-step resolution guide for the technician.

Respond ONLY with a valid JSON object in this exact format, no extra text:
{{
  "steps": [
    {{
      "stepNumber": 1,
      "title": "Short action title",
      "details": "Detailed explanation of exactly what to do in this step",
      "warning": "Optional safety warning or null if none"
    }}
  ],
  "estimatedTime": "e.g. 30 minutes",
  "toolsRequired": ["tool1", "tool2"],
  "safetyNotes": "Overall safety precautions before starting"
}}

Rules:
- Provide 4-8 concrete, actionable steps specific to the fault category
- If severity is CRITICAL, start with an immediate safety step
- toolsRequired should list actual tools needed
- safetyNotes should mention PPE or power-off requirements if relevant
- Be specific to campus/educational facility context
"""

        response = vision_model.generate_content(prompt)
        raw_text = response.text.strip()

        # Strip markdown code block if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        result = json.loads(raw_text)
        result.setdefault("steps", [])
        result.setdefault("estimatedTime", "Unknown")
        result.setdefault("toolsRequired", [])
        result.setdefault("safetyNotes", "Follow standard safety procedures.")

        return {"status": "success", "resolution": result}

    except Exception as e:
        import traceback
        print(f"Resolution steps error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return {
            "status": "fallback",
            "resolution": {
                "steps": [
                    {
                        "stepNumber": 1,
                        "title": "Manual Assessment Required",
                        "details": "AI resolution guide unavailable. Technician should assess the issue on-site and follow standard protocol.",
                        "warning": None
                    }
                ],
                "estimatedTime": "Unknown",
                "toolsRequired": [],
                "safetyNotes": "Follow all standard safety procedures."
            }
        }
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
    
# --- MODULE 4: Smart Notification Delivery AI ---

class NotificationRequest(BaseModel):
    user_email: str
    hour_of_day: float
    is_urgent: bool

@app.post("/api/notifications/smart-delivery")
def evaluate_delivery_time(request: NotificationRequest):
    # 1. Urgent alerts (like "Booking Cancelled 10 mins before start") ALWAYS bypass the AI
    if request.is_urgent:
        return {"action": "SEND_NOW", "confidence": 1.0}

    # 2. Simple Heuristic AI (In a real system, this would be a trained Logistic Regression model 
    # based on the exact times this specific user usually clicks 'read' on their notifications)
    
    # Let's assume standard "Low Attention" hours are between 10:00 PM (22.0) and 7:00 AM (7.0)
    if request.hour_of_day >= 22.0 or request.hour_of_day <= 7.0:
        return {
            "action": "HOLD_FOR_DIGEST", 
            "confidence": 0.85,
            "reason": "Predicted user sleep/away cycle. Queuing for 8:00 AM digest."
        }
    
    # Otherwise, it's daytime, blast it through!
    return {
        "action": "SEND_NOW", 
        "confidence": 0.92,
        "reason": "Active user hours detected."
    }

# --- END MODULE 4 ---

# --- MODULE A: Predictive Maintenance AI ---

class AssetHealthRequest(BaseModel):
    asset_type: str
    total_booked_hours: float
    age_in_days: int

@app.post("/api/assets/predict-health")
def predict_asset_health(request: AssetHealthRequest):
    # In a real enterprise system, this would use a Survival Analysis Model (like Kaplan-Meier).
    # Here we use a weighted degradation algorithm based on asset vulnerability.
    
    # 1. Define base lifespan and vulnerability multipliers
    vulnerability = {
        "EQUIPMENT": 1.5,     # Projectors break fast
        "LAB": 1.2,           # Heavy computer usage
        "MEETING_ROOM": 0.8,  # Just chairs and tables
        "LECTURE_HALL": 0.5   # Very durable
    }
    
    multiplier = vulnerability.get(request.asset_type, 1.0)
    
    # 2. Calculate degradation (Simulated ML Curve)
    # The more hours used, the faster health drops.
    wear_from_usage = (request.total_booked_hours * multiplier) / 10.0
    wear_from_age = request.age_in_days / 30.0
    
    total_degradation = wear_from_usage + wear_from_age
    
    # 3. Final Health Score (Starts at 100%, cannot go below 0%)
    health_score = max(0.0, 100.0 - total_degradation)
    
    return {
        "health_score": round(health_score, 1),
        "needs_maintenance": bool(health_score < 25.0), # Flag for Admin if under 25%
        "estimated_days_remaining": int((health_score / max(0.1, total_degradation)) * 30) if total_degradation > 0 else 999
    }
    
# --- END MODULE A ---

