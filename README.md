# 🏫 Smart Campus Operations Hub

> An AI-powered campus resource management platform built for **IT3030 — Platform-Based Application Framework** (2026).

Smart Campus Hub is a full-stack web application that enables students, staff, and administrators to manage campus facilities (lecture halls, labs, meeting rooms, and equipment) with intelligent features like semantic search, predictive maintenance, damage assessment, and anomaly-based login detection.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [AI / ML Modules](#-ai--ml-modules)
- [Role-Based Access](#-role-based-access)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## ✨ Features

### 🔐 Authentication & Security
- **Google OAuth 2.0** sign-in with JWT token-based session management
- **Role-Based Access Control (RBAC)** — `USER`, `ADMIN`, `TECHNICIAN`
- **Anomaly Detection** — AI-powered suspicious login time detection using Isolation Forest

### 📦 Resource Management
- Full CRUD for campus resources (Lecture Halls, Labs, Meeting Rooms, Equipment)
- Cover image support with URL preview
- **AI Predictive Health Scoring** — autonomous background job forecasts equipment degradation
- Maintenance alerts when health score drops below 25%
- Resource status management (Active, Maintenance, Out of Service)

### 🔍 AI-Powered Semantic Search
- Natural language queries like *"a quiet room for 50 people with a projector"*
- Sentence Transformer embeddings (`all-MiniLM-L6-v2`) indexed in **Pinecone** vector DB
- **Dual-layer search** — local keyword matching + semantic similarity
- Results split into **Exact Matches** and **AI-Suggested Alternatives**

### 📅 Booking System
- Create, view, and manage reservations for campus resources
- **AI No-Show Prediction** — Random Forest classifier scores booking risk
- Auto-approval for low-risk bookings (under 40% no-show probability)
- Admin approval/rejection workflow
- Smart check-in system with geolocation validation

### 🎫 Maintenance Ticketing
- Users can report campus issues with image attachments (up to 3)
- **Gemini Vision AI Damage Assessment** — auto-classifies fault category, severity, priority, and technician routing
- **AI Resolution Steps** — Gemini generates step-by-step repair guides with safety notes, tools, and time estimates
- SLA timers for first response and resolution targets
- Comment threads with role-based styling (User / Technician / Admin)
- Technicians can update status (Open → In Progress → Resolved → Closed) and delete tickets

### 🔔 Smart Notifications
- Real-time notification system with bell indicator
- **AI Delivery Optimization** — holds non-urgent notifications during sleep hours for 8 AM digest
- Status change alerts, staff replies, and ticket updates
- Mark as read / mark all as read

### 📊 Admin Dashboard
- **Control Panel** with tabbed navigation: Resources, System Logs, User Access, Booking Requests, Tickets
- User role management (USER / ADMIN / TECHNICIAN)
- Account status control (Active / Suspended / Deleted)
- Ticket workflow pipeline visualization (Kanban-style)
- Audit log viewer for system-wide activity tracking

### 👨‍🔧 Technician Portal
- Dedicated dashboard with stat cards and urgent ticket widget
- Ticket distribution progress bar
- **Manage Tickets** page with expand/collapse details, SLA timers, and AI assessment panels

---

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                 │     │                  │     │                  │
│  React Frontend │────▶│  Spring Boot API │────▶│  MongoDB Atlas   │
│  (Vite, :5173)  │     │  (REST, :8080)   │     │  (Cloud DB)      │
│                 │     │                  │     │                  │
└────────┬────────┘     └────────┬─────────┘     └──────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Google OAuth   │     │  Python AI       │
│  (Sign-In)      │     │  Engine (:8000)  │
│                 │     │  - FastAPI        │
└─────────────────┘     │  - Pinecone      │
                        │  - Gemini Vision │
                        │  - Scikit-Learn  │
                        └──────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |
| **CSS (Vanilla)** | Styling with modern design system |

### Backend
| Technology | Purpose |
|---|---|
| **Spring Boot 4.0** | REST API framework |
| **Spring Security** | Authentication & JWT |
| **Spring Data MongoDB** | Database ORM |
| **Google API Client** | OAuth 2.0 token verification |
| **JJWT 0.11.5** | JWT generation & validation |
| **Lombok** | Boilerplate reduction |
| **WebSocket** | Real-time communication |
| **Scheduled Tasks** | Autonomous health check CRON |

### AI / ML Service
| Technology | Purpose |
|---|---|
| **FastAPI** | Python REST API |
| **Sentence Transformers** | Semantic embedding (`all-MiniLM-L6-v2`) |
| **Pinecone** | Vector database for similarity search |
| **Google Gemini 2.5 Flash** | Vision-based damage assessment & resolution steps |
| **Scikit-Learn** | Isolation Forest (anomaly), Random Forest (no-show) |
| **NumPy** | Numerical computations |
| **Pillow** | Image processing |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud NoSQL database |
| **Pinecone** | Vector index for semantic search |

---

## 🤖 AI / ML Modules

| Module | Model / Algorithm | Description |
|---|---|---|
| **A — Predictive Maintenance** | Weighted Degradation Formula | Autonomous CRON job forecasts asset health based on usage hours, age, and vulnerability profile |
| **B — No-Show Prediction** | Random Forest Classifier | Predicts booking no-show probability; auto-approves low-risk bookings |
| **C — Semantic Search** | Sentence Transformer + Pinecone | Natural language resource discovery with vector similarity |
| **D — Smart Notifications** | Heuristic AI Delivery | Delays non-urgent notifications during predicted sleep hours |
| **E — Anomaly Detection** | Isolation Forest | Detects suspicious login times by learning user login patterns |
| **F — Damage Assessment** | Gemini 2.5 Flash Vision | Analyzes uploaded images to classify fault category, severity, priority, and technician routing |
| **G — Resolution Steps** | Gemini 2.5 Flash (Text) | Generates step-by-step repair guides with safety notes and tool lists |

---

## 👥 Role-Based Access

| Feature | 👤 User | 🛡️ Admin | 🔧 Technician |
|---|:---:|:---:|:---:|
| Browse Resources | ✅ | ✅ | ❌ |
| Book Resources | ✅ | ❌ | ❌ |
| Report Tickets | ✅ | ❌ | ❌ |
| View My Tickets | ✅ | ❌ | ❌ |
| Manage Resources (CRUD) | ❌ | ✅ | ❌ |
| Manage Users & Roles | ❌ | ✅ | ❌ |
| Approve/Reject Bookings | ❌ | ✅ | ❌ |
| View Audit Logs | ❌ | ✅ | ❌ |
| View Ticket Workflow | ❌ | ✅ | ❌ |
| Manage Tickets (status) | ❌ | ❌ | ✅ |
| Delete Tickets | ❌ | ✅ | ✅ |
| AI Resolution Steps | ❌ | ❌ | ✅ |

### Navigation by Role

- **User** → Home, Browse Resources, My Bookings, Tickets
- **Admin** → Admin Home, Manage (Control Panel)
- **Technician** → Home, Manage Tickets

---

## 📁 Project Structure

```
smart-campus/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx     # Admin Control Panel (Resources, Users, Logs, Bookings, Tickets)
│   │   │   ├── AdminHome.jsx          # Admin landing page with stats
│   │   │   ├── BookingDashboard.jsx   # My Bookings + New Reservation
│   │   │   ├── LandingPage.jsx        # Public homepage (hero, features, resources, contact)
│   │   │   ├── LoginPage.jsx          # Google OAuth login
│   │   │   ├── TechnicianHome.jsx     # Technician dashboard
│   │   │   ├── TicketsPage.jsx        # Ticket page wrapper (Report / My Tickets tabs)
│   │   │   ├── UserDashboard.jsx      # Browse Resources (AI search)
│   │   │   ├── UserHome.jsx           # User dashboard with upcoming bookings
│   │   │   ├── UserProfile.jsx        # Profile management
│   │   │   └── tickets/
│   │   │       ├── AdminTicketsPage.jsx   # Technician Manage Tickets
│   │   │       ├── MyTicketsPage.jsx      # User's ticket list
│   │   │       ├── ReportTicketPage.jsx   # Raise a ticket (with AI panel)
│   │   │       └── SlaTimer.jsx           # SLA countdown component
│   │   ├── services/
│   │   │   └── ticketService.js       # Ticket API client
│   │   ├── App.jsx                    # Routing & navigation
│   │   └── index.css                  # Global design system
│   └── package.json
│
├── backend/                    # Spring Boot
│   └── src/main/java/com/smartcampus/
│       ├── auth/               # Google OAuth, JWT utilities, Security config
│       ├── resource/           # Resource CRUD + Semantic Search + Predictive Maintenance
│       ├── booking/            # Booking CRUD + No-Show Prediction
│       ├── ticket/             # Ticket CRUD + Comments + SLA tracking
│       ├── user/               # User management + Role/Status control
│       ├── notification/       # Smart notification delivery
│       ├── audit/              # Audit logging
│       ├── config/             # CORS, WebSocket, Scheduled tasks
│       └── exception/          # Global error handler
│
├── ai-service/                 # Python FastAPI
│   ├── main.py                 # All AI endpoints
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # API keys (Pinecone, Google)
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+** (JDK)
- **Node.js 18+** & npm
- **Python 3.10+**
- **MongoDB Atlas** account (free tier works)
- **Pinecone** account (free tier)
- **Google Cloud Console** project (for OAuth + Gemini API key)

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/smart-campus.git
cd smart-campus
```

### 2. Start the Java Backend
```bash
cd backend
./mvnw clean spring-boot:run
```
> Runs on `http://localhost:8080`

### 3. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
> Runs on `http://localhost:5173`

### 4. Start the Python AI Engine
```bash
cd ai-service
python -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
> Runs on `http://localhost:8000`

---

## 🔑 Environment Variables

### Backend (`backend/src/main/resources/application.properties`)
```properties
spring.data.mongodb.uri=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
google.client.id=<your-google-client-id>
jwt.secret=<your-jwt-secret>
```

### AI Service (`ai-service/.env`)
```env
PINECONE_API_KEY=<your-pinecone-api-key>
GOOGLE_API_KEY=<your-google-gemini-api-key>
```

### Frontend (`frontend/.env` or hardcoded in `LoginPage.jsx`)
```env
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

---

## 📡 API Endpoints

### Resources
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/resources` | Get all resources | Public |
| `GET` | `/api/resources/{id}` | Get resource by ID | Public |
| `GET` | `/api/resources/search?q=` | Semantic AI search | Public |
| `POST` | `/api/resources` | Create resource | Admin |
| `PUT` | `/api/resources/{id}` | Update resource | Admin |
| `DELETE` | `/api/resources/{id}` | Delete resource | Admin |

### Bookings
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/bookings/mine` | Get my bookings | User |
| `GET` | `/api/bookings/all` | Get all bookings | Admin |
| `POST` | `/api/bookings` | Create booking | User |
| `PUT` | `/api/bookings/{id}/status` | Approve/reject booking | Admin |
| `POST` | `/api/bookings/{id}/checkin` | Check in to booking | User |

### Tickets
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/tickets` | Get all tickets | Admin/Tech |
| `GET` | `/api/tickets/mine` | Get my tickets | User |
| `GET` | `/api/tickets/{id}` | Get ticket by ID | Owner/Admin/Tech |
| `POST` | `/api/tickets` | Create ticket | User |
| `PATCH` | `/api/tickets/{id}/status` | Update ticket status | Admin/Tech |
| `POST` | `/api/tickets/{id}/comments` | Add comment | Any |
| `DELETE` | `/api/tickets/{id}` | Delete ticket | Admin/Tech |

### Users
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users` | Get all users | Admin |
| `PUT` | `/api/users/{id}/role` | Change user role | Admin |
| `PUT` | `/api/users/{id}/status` | Change account status | Admin |

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/google` | Google OAuth login | Public |

### AI Service (Python)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/search` | Semantic vector search |
| `POST` | `/api/index` | Index a resource |
| `POST` | `/api/analyze-damage` | Gemini Vision damage assessment |
| `POST` | `/api/resolution-steps` | Gemini resolution guide |
| `POST` | `/api/predict/no-show` | No-show risk prediction |
| `POST` | `/api/anomaly/login` | Suspicious login detection |
| `POST` | `/api/assets/predict-health` | Asset health prediction |
| `POST` | `/api/notifications/smart-delivery` | Notification delivery AI |
| `GET` | `/health` | Health check |

---

## 🎨 Design System

The application uses a **dark-themed modern design system** with:

- **Color Palette**: Zinc scale (`#09090b` → `#fafafa`), accented with blue (`#3b82f6`), purple (`#8b5cf6`), and green (`#22c55e`)
- **Typography**: System font stack with 800 weight headings
- **Components**: Gradient headers, frosted-glass badges, pill-shaped filters, Toast notifications, SLA timers
- **Micro-animations**: Hover lift effects, fade-ins, pulse rings, smooth transitions
- **Responsive Layout**: Grid-based cards, mobile-friendly forms

---

## 👨‍💻 Team

| Member | Student ID | Role |
|---|---|---|
| Member 1 | IT23716414 | Booking Module |
| Member 2 | IT23595408 | Resource Management Module|
| Member 3 | IT23661738 | Authorization and Notification Module |
| Member 4 | IT23249066 | Ticket Module |

> **Module**: IT3030 — Platform-Based Application Framework  
> **Institution**: Sri Lanka Institute of Information Technology (SLIIT)  
> **Year**: 2026

---

## 📄 License

This project is developed for academic purposes as part of the IT3030 coursework at SLIIT.

---

<p align="center">
  <b>Smart Campus Hub</b> — Intelligent Campus Operations, Reimagined.
</p>