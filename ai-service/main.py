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
