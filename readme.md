
<p align="center">
<img src="assets/translogo.png" alt="Texton Logo" width="320"/>
</p>
<p align="center"><b>"Talk With Your Text — AI Powered Document Intelligence"</b></p>

📌 About
Texton.ai is an advanced AI-driven platform that allows users to upload documents (PDF, DOCX, TXT), process them using a scalable backend pipeline, generate embeddings, store vectors, and chat with the document in real time using LLMs.
Built by LeafCore Labs, Texton.ai integrates:

Spring Boot (secure backend)

ChromaDB (vector search)

Apache Tika (text extraction)

Garage S3 (S3-compatible object storage for easy local setup)

Gemini/OpenAI for intelligent Q&A

It is designed for:
✔️ Students
✔️ Professionals
✔️ Analysts
✔️ Organizations

Anyone who wants fast & deep understanding of long documents.

🌟 Key Features
🔐 Role-Based Authentication

Signup/Login with JWT

User / Admin permission levels

Secure session management

📄 Document Upload + Ingestion Pipeline
When a file is uploaded:

Stored in MinIO S3

Text extracted using Apache Tika

Embeddings generated

Vectors stored in ChromaDB

User gets real-time status via SSE

🧠 Chat With Documents
Ask questions like:

“Summarize section 3”

“Explain the formula on page 4”

“What are the key insights?”
Uses:

Gemini / OpenAI

Context retrieved using vector search

⚡ Real-Time Status Updates
Document shows:

PROCESSING

PROCESSED

FAILED
All via Server Sent Events (SSE).

🗄️ Scalable Microservice Architecture

Independent Docker services

Persistent storage

Modular Spring Boot layers

🏛️ Architecture Overview
````bash
| Layer | Technology |
| :--- | :--- |
| Frontend | React (Vite) |
| Backend | Spring Boot (JWT + REST + SSE) |
| Document Parsing | Apache Tika REST Server |
| Vector Database | ChromaDB |
| Object Storage | Garage S3 |
| Embeddings | Google Gemini / OpenAI |
| Auth | Spring Security + JWT |
````
````bash
D:\Texton.ai\
├── backend\
│   ├── src\
│   │   ├── main\
│   │   │   ├── java\
│   │   │   │   └── com\texton\backend\
│   │   │   │       ├── config\
│   │   │   │       │   ├── CorsConfig.java
│   │   │   │       │   ├── DataInitializer.java
│   │   │   │       │   └── SecurityConfig.java
│   │   │   │       │
│   │   │   │       ├── controllers\
│   │   │   │       │   ├── AuthController.java
│   │   │   │       │   └── DocumentController.java
│   │   │   │       │
│   │   │   │       ├── models\
│   │   │   │       │   ├── Document.java
│   │   │   │       │   └── User.java
│   │   │   │       │
│   │   │   │       ├── repositories\
│   │   │   │       │   ├── DocumentRepository.java
│   │   │   │       │   └── UserRepository.java
│   │   │   │       │
│   │   │   │       ├── service\
│   │   │   │       │   ├── AiService.java
│   │   │   │       │   ├── AuthService.java
│   │   │   │       │   ├── ChromaDB.java
│   │   │   │       │   ├── DocumentService.java
│   │   │   │       │   ├── EmbeddingService.java
│   │   │   │       │   ├── JwtService.java
│   │   │   │       │   ├── ParsingService.java
│   │   │   │       │   ├── S3Service.java
│   │   │   │       │   ├── TikaClient.java
│   │   │   │       │   ├── VectorStoreService.java
│   │   │   │       │   └── UserDetailsServiceImpl.java
│   │   │   │       │
│   │   │   │       └── websocket\
│   │   │   │           └── DocumentStatusSse.java
│   │   │   │
│   │   │   ├── TextonBackendApplication.java
│   │   │   └── resources\
│   │   │       └── application.yml
│   │   └── test\
│   ├── pom.xml
│   └── mvnw
│
├── frontend\
│   └── src\
│       ├── App.jsx
│       ├── translogo.png
│       ├── Code_v.png
│       └── (other UI components)
│
├── services\
│   ├── docker-compose.chromadb.yml
│   ├── docker-compose.garage.yml
│   ├── docker-compose.tika.yml
│   ├── run_service.bat
│   ├── stop_services.bat
│   │
│   ├── chromadb\
│   │   └── data\
│   │
│   ├── garage\
│   │   ├── garage.toml
│   │   ├── data\
│   │   └── meta\
│   │
│   └── tika\
│       └── tika-config.xml
│
├── assets\
│   └── logos\
│
└── readme.md
````


🐳 Run the Full Stack with Docker (recommended)

From the project root:

````bash
cp .env.example .env
# Edit .env — set GEMINI_API_KEY and JWT_SECRET

docker compose up --build
````

| Service | URL |
| :--- | :--- |
| Frontend (UI) | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| ChromaDB | http://localhost:8000 |
| Apache Tika | http://localhost:9998 |
| Garage S3 API | http://localhost:3900 |

> **Note:** The backend still uses embedded Tika, in-memory vector search, and local file storage by default. ChromaDB, Garage, and Tika containers run alongside the app for future integration and local parity with production.

---

🐳 Docker Services (infrastructure only)
Texton.ai uses 3 microservices:

1️⃣ Apache Tika (Port 9998)
Parses documents → returns raw text.

2️⃣ ChromaDB (Port 8000)
Stores text embeddings, allows semantic search.

3️⃣ Garage S3 (Port 9000/9001)
S3-compatible object store for PDFs & files.

Start all services:
````bash
# From the root directory:
sh ./services/run_service.sh
````

Stop all services:
````bash
# From the root directory:
sh ./services/stop_services.sh
````

⚙️ Backend Installation (Spring Boot)
````bash
cd backend
mvn clean install
mvn spring-boot:run
````
````bash
Backend runs on: http://localhost:8080
````
💻 Frontend Installation (React)

````bash
cd frontend
npm install
npm run dev
````
````bash
Frontend runs on: http://localhost:5173
````
````bash
🛠️ API Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| /auth/signup | POST | Register user |
| /auth/login | POST | Login, returns JWT |
| /api/upload | POST | Upload document |
| /api/documents | GET | Get user's documents |
| /api/query | POST | Ask question about document |
| /api/documents/{id}/stream | GET | SSE: get status updates |
````

<p align="center">
<img src="assets/Code_v.png" alt="LeafCore Logo" width="200"/>
</p>
<p align="center"><b>Made with ❤️ by LeafCore Labs</b></p>