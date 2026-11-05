# LostLink

### AI-Powered Lost & Found Management and Verification System

LostLink is an AI-powered lost-and-found management platform designed to streamline the process of reporting, discovering, matching, and recovering lost belongings within PES University RR Campus.

The platform combines a web-based reporting system, intelligent image and text analysis, vector-based similarity search, and a structured claim verification workflow.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [AI and Matching Pipeline](#ai-and-matching-pipeline)
- [Claim and Verification Workflow](#claim-and-verification-workflow)
- [Database](#database)
- [API Services](#api-services)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Security](#security)
- [Future Improvements](#future-improvements)

---

## Overview

Traditional lost-and-found processes often depend on manual communication, physical notices, and unstructured descriptions.

LostLink addresses these challenges through a centralized platform where users can:

1. Submit lost-item and found-item reports.
2. Upload images and provide item descriptions.
3. Discover potentially matching reports.
4. Submit claims for found belongings.
5. Provide evidence to support ownership.
6. Track claim progress and notifications.

Moderators and administrators can review reports, verify evidence, manage claims, and complete the handover process.

**Primary deployment context:** PES University RR Campus, Bengaluru, India.

---

## Key Features

### User Management
- User registration and login.
- Secure password hashing.
- Session-based authentication.
- Role-based access for users, moderators, and administrators.

### Lost and Found Reporting
- Submit lost-item reports.
- Submit found-item reports.
- Add item descriptions and categories.
- Associate reports with campus locations.
- Upload item images.
- View and manage personal reports.

### AI-Powered Analysis
- Image analysis.
- Object detection and classification.
- Text-based item representation.
- CLIP-based visual and text similarity search.
- Hybrid matching pipeline.

### Intelligent Matching
- Discover potentially matching lost and found reports.
- Use visual and textual information to improve matching.
- Retrieve similar reports using vector search.

### Claim Management
- Submit ownership claims.
- Upload supporting evidence.
- Moderator review and escalation.
- Administrator approval or rejection.
- Complete physical handover of verified items.

### Moderation and Administration
- Review reports and uploaded images.
- Manage claims.
- Review evidence.
- Track notifications and administrative activity.

### Vector Cleanup
- Remove report-related text and CLIP vectors from Qdrant after successful handover.
- Protect the internal cleanup endpoint using a bearer token.
- Perform cleanup after the MySQL transaction commits.
- Treat cleanup as best-effort so a vector database failure does not reverse a completed handover.

---

## System Architecture

LostLink consists of three major application layers.

```text
                  LOSTLINK PLATFORM
                         |
          +--------------+--------------+
          |                             |
     FRONTEND                      AI SERVICE
   Next.js / React                  FastAPI
          |                             |
          |                       +-----+------+
          |                       |            |
          |                  AI Analysis   Matching
          |                       |            |
          |                       +-----+------+
          |                             |
          +-------------+---------------+
                        |
                BACKEND API LAYER
                        |
              +---------+---------+
              |                   |
          MySQL Database      Qdrant Vector DB
              |                   |
       Users / Reports       Text Vectors
       Claims / Evidence     CLIP Vectors
       Notifications         Similarity Search
```

### Application Components

| Component | Responsibility |
|---|---|
| Next.js frontend | User interface and application routes |
| Next.js API routes | Authentication, reports, claims and business logic |
| FastAPI AI service | Image analysis, object analysis and matching |
| MySQL | Persistent relational data |
| Qdrant | Vector storage and similarity search |

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend API | Next.js Route Handlers |
| AI Backend | Python, FastAPI |
| Authentication | JOSE, bcryptjs |
| Relational Database | MySQL |
| Database Driver | mysql2 |
| Vector Database | Qdrant |
| Image and Vision Models | CLIP, YOLO |
| Text Embeddings | Sentence Transformers / MiniLM |
| API Documentation | FastAPI Swagger UI |

---

## Project Structure

```text
LostLink/
|
+-- frontend/
|   +-- public/
|   +-- src/
|       +-- app/
|       |   +-- admin/
|       |   +-- claims/
|       |   +-- login/
|       |   +-- matches/
|       |   +-- moderator/
|       |   +-- my-reports/
|       |   +-- notifications/
|       |   +-- register/
|       |   +-- report/
|       |   +-- api/
|       |       +-- auth/
|       |       +-- claims/
|       |       +-- reports/
|       |       +-- matching/
|       +-- lib/
|   +-- package.json
|
+-- ai-service/
|   +-- app/
|       +-- api/
|       |   +-- clip_search.py
|       |   +-- full_analysis.py
|       |   +-- image_analysis.py
|       |   +-- matching.py
|       |   +-- object_analysis.py
|       |   +-- report_cleanup.py
|       +-- services/
|           +-- clip_embedder.py
|           +-- clip_indexer.py
|           +-- clip_search.py
|           +-- clip_text_search.py
|           +-- hybrid_matcher.py
|           +-- image_processor.py
|           +-- item_classifier.py
|           +-- matching_pipeline.py
|           +-- mysql_client.py
|           +-- object_detector.py
|           +-- qdrant_client.py
|           +-- report_indexer.py
|           +-- report_repository.py
|           +-- similarity_engine.py
|           +-- text_embedder.py
|           +-- vector_store.py
|   +-- tests/
|
+-- database/
|   +-- schema/
|   +-- seed/
|   +-- procedures/
|   +-- triggers/
|   +-- views/
|   +-- tests/
|
+-- docs/
    +-- database-design/
    +-- er-diagram/
```

---

## AI and Matching Pipeline

LostLink uses AI-based processing to improve the discovery of potentially related lost and found reports.

### 1. Image Processing
Uploaded images are processed by the AI service to extract useful visual information.

### 2. Object Detection and Classification
The object detection component uses YOLO-based processing to identify objects and relevant visual features.

### 3. Text Embeddings
Descriptions are converted into numerical vector representations using a MiniLM-based embedding pipeline.

### 4. CLIP Embeddings
CLIP is used to represent images and text in a shared embedding space, supporting cross-modal similarity search.

### 5. Vector Search
Qdrant stores and retrieves vector representations for similarity-based discovery.

### 6. Hybrid Matching
The matching pipeline combines available visual and textual similarity information to identify candidate reports.

---

## Claim and Verification Workflow

```text
User submits a LOST report
          |
User submits a FOUND report
          |
AI matching identifies candidates
          |
User submits ownership claim
          |
Moderator reviews claim
          |
     +----+----+
     |         |
 Escalate   Reject
     |
 Administrator reviews
     |
 Approve / Reject
     |
 Physical handover
     |
 Claim = HANDED_OVER
     |
 Related reports = CLOSED
     |
 MySQL transaction commits
     |
 Qdrant vector cleanup
```

Vector cleanup is executed after the database transaction commits. This prevents a Qdrant failure from undoing a successful physical handover.

---

## Database

LostLink uses MySQL for structured application data.

Database scripts are organized by purpose:

| Directory | Purpose |
|---|---|
| `database/schema/` | Database and table creation |
| `database/seed/` | Initial and sample data |
| `database/procedures/` | Stored procedures |
| `database/triggers/` | Database triggers |
| `database/views/` | Reporting views |
| `database/tests/` | Database validation scripts |

Database documentation:

- `docs/database-design/data-dictionary.md`
- `docs/er-diagram/lostlink-er-diagram.md`

Qdrant is used separately for vector storage and similarity retrieval.

---

## API Services

### Frontend API Routes

The Next.js application provides routes for:

| Route | Responsibility |
|---|---|
| `/api/auth/register` | User registration |
| `/api/auth/login` | User login |
| `/api/auth/logout` | User logout |
| `/api/auth/me` | Current user information |
| `/api/reports` | Report creation and retrieval |
| `/api/reports/mine` | User's reports |
| `/api/claims` | Claim management |
| `/api/matching` | Matching requests |
| `/api/notifications` | Notifications |
| `/api/locations` | Campus locations |
| `/api/categories` | Item categories |

Additional routes support evidence submission, image review, claim review, and physical handover.

### AI Service Endpoints

The FastAPI application registers routers for:

- Image analysis
- Object analysis
- Full analysis
- AI matching
- CLIP search
- Report vector cleanup

API documentation is available through Swagger UI at:

`http://127.0.0.1:8000/docs`

---

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- Python 3.12 or a compatible version
- MySQL Server
- Qdrant
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Uthkarsha413/LostLink.git
cd LostLink
```

### 2. Configure MySQL

Start your MySQL server.

Create the database and tables using the SQL scripts in this order:

1. `database/schema/01_create_database.sql`
2. `database/schema/02_create_tables.sql`
3. `database/schema/03_constraints_indexes.sql`

Then apply the relevant procedures, triggers, views, and seed scripts.

### 3. Configure the Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` and configure the required database and AI service connection variables.

### 4. Configure the AI Service

From the project root:

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
```

Install the Python dependencies required by the AI service, and configure `ai-service/.env`.

> The repository currently does not include a Python dependency manifest. A `requirements.txt` should be added to make fresh installations reproducible.

### 5. Configure Qdrant

Start a Qdrant instance and configure its connection details in the AI service environment.

Ensure the required vector collections are created before running indexing and search workflows.

---

## Environment Configuration

Environment files must remain private and must never be committed to Git.

### Frontend

The frontend requires configuration for:

- MySQL connection
- AI service URL
- Internal AI service authentication token

### AI Service

The AI service requires configuration for:

- MySQL connection
- Qdrant connection
- Model configuration where applicable
- Internal cleanup authentication token

Use the variable names and values appropriate to your local environment. Never publish passwords, tokens, or database credentials.

---

## Running the Application

Open separate terminal windows.

### Terminal 1 — AI Service

```bash
cd LostLink/ai-service
source .venv/bin/activate

python3 -m uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8000
```

AI service:

`http://127.0.0.1:8000`

Swagger documentation:

`http://127.0.0.1:8000/docs`

### Terminal 2 — Frontend

```bash
cd LostLink/frontend
npm run dev
```

Frontend:

`http://localhost:3000`

---

## Testing

### Frontend TypeScript Validation

```bash
cd frontend
npx tsc --noEmit
```

### Frontend Linting

```bash
cd frontend
npm run lint
```

### Frontend Production Build

```bash
cd frontend
npm run build
```

### AI Service

Use the available tests under `ai-service/tests/` and verify the API through Swagger UI.

### Database

Execute the SQL validation scripts under `database/tests/`.

---

## Security

LostLink incorporates several security measures:

- Password hashing using bcryptjs.
- Session and authentication handling.
- Role-based access control.
- Protected internal AI service cleanup endpoint.
- Bearer-token verification for internal cleanup requests.
- Environment-based secret management.
- Git ignore rules for environment files and private uploads.

Private uploads and authentication files must not be exposed through public repository commits.

---

## Future Improvements

Potential areas for future development include:

- More advanced multimodal matching models.
- Improved matching evaluation and ranking.
- Expanded campus location intelligence.
- Automated notifications and reminders.
- Comprehensive automated testing.
- Reproducible AI dependency management.
- Monitoring and observability for AI and vector services.
- Reliable background retries for failed vector cleanup.

---

## Project Information

**Project:** LostLink  
**Category:** AI-Powered Lost & Found Management System  
**Institution:** PES University  
**Campus:** RR Campus, Bengaluru, India  
**Repository:** [GitHub - LostLink](https://github.com/Uthkarsha413/LostLink)

---

*LostLink — Making lost-item recovery smarter, faster, and more reliable.*
