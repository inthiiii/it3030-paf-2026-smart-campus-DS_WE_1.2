# Smart Campus Operations System

## 🚀 Quick Start Guide for New Developers

### 1. Start the Java Backend
cd backend
./mvnw clean spring-boot:run

### 2. Start the React Frontend (New Terminal)
cd frontend
npm install
npm run dev

### 3. Start the Python AI Engine (New Terminal)
cd ai-service
# Activate your virtual environment first!
pip install -r requirements.txt
uvicorn main:app --reload --port 8000