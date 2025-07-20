**Utku attended the meeting today and confirmed that he still wants to continue with the project.**

**Considering the limited time remaining, I believe it would be reasonable for him to focus solely on the TTC-Workout-Service, taking full responsibility for it. This includes:**

* **Core functionality**

* **Client integration**

* **Backend integration & API Gateway**

* **CI/CD & deployment setup (including tests)**

* **Monitoring specifically for this microservice**

**This way, the tasks would be mostly independent, and we would have a complete, presentable component by the end of the project.**

**If Utku agrees, we can proceed with this plan.**

📢 **TTC-Workout-Service – Final Task Summary for Utku**

🎯 The `TTC-Workout-service` receives a `.md` workout file and converts it to a `.mp3` audio file using a GenAI or TTS model. The audio should be downloadable or playable on the client.

---

👤 **My Side (Hakan)**

🛠 Deployment & Infra:

* "Deployment is almost the only main part not completed yet in general. Pipeline with tests is ready. **Image generation is missing**."

* "Docker image generation via **GitHub Actions** and **Kubernetes & Terraform deployment** (except TTC) will be completed **by Sunday**."

* "Monitoring (**Prometheus/Grafana**) setup will be completed **on Monday**."

* `Workout-plan-service` integration with the client will be completed **on Saturday**.  
* Bug \- Fixes (Unit Test Bugs etc.) \- Documentations \- Bonus

  ---

👨‍💻 **Utku – Your Main Responsibility**  
 You’re responsible for **everything related to TTC-Workout-service**, based on the **Project Grading Criteria** and **Project Detail Document**. Please check documentations from Artemis

---

✅ **1\. TTC Service Core Functionality**

* Accept a `.md` file (Markdown workout text) as input (example already exists on the client).

* Convert the Markdown to **audio using a TTS model** (Bark, Coqui, Tortoise, etc.).

* (Optional) Pre-process content using an LLM for better voice output or personalization.

* Return `.mp3` or `.wav` audio file for download or streaming.

  ---

🖥️ **2\. Client Integration**

* Add a **"Generate Audio"** button to the client.

* Upload or select a `.md` workout file.

* Call the TTC API endpoint and handle the response.

* Provide a **download button** or **inline audio playback**.

* Show loading/progress indication during audio generation.

  ---

🔁 **3\. Backend Integration & API Gateway**

* Define TTC endpoints using **Swagger/OpenAPI**.

* Register TTC in the **Service Registry** (e.g., Eureka).

* Route TTC endpoints through the **API Gateway**.

* Secure the endpoint if necessary (auth token or role-based access).

  ---

📦 **4\. Dockerization & Local Setup**

* Create a **Dockerfile** for TTC-Workout-service.

* Add TTC to **`docker-compose.yml`** (both `dev` and `prod` environments).

* Ensure the TTS model and all dependencies run inside the container.

* Local setup should work with ≤3 commands:

---

🚀 **5\. CI/CD & Deployment**

🧠 My note: CI/CD will be ready **except TTC** by **Sunday**

* Add **TTC Docker image generation** in GitHub Actions.

* Push image to **DockerHub or GitHub Container Registry**.

* Add deployment configuration to **Kubernetes (via Terraform)**:

  * `Deployment.yaml`

  * `Service.yaml`

  * `ConfigMap` or `Secrets.yaml` if needed.

  ---

📊 **6–8 (Short Summary)**

Please check documentations from Artemis

**6\. Monitoring –  Hakan part will done by Monday**

* Add `/metrics` endpoint for Prometheus (requests, latency, error count).

* Create **Grafana dashboards** (audio gen time, errors, throughput).

**7\. Testing & Engineering** 

* Add TTC unit \+ integration tests.

* Include in CI.

* Update architecture/use case/object diagrams.

**8\. Documentation** 

* Update `README.md` (setup, usage, local instructions).

* Add TTC details to **Confluence** (monitoring, Swagger, CI/CD, etc.).

* Export Grafana dashboards as `.json`.






dikkat edilecekler:

✅ Project Grading Checklist (100 Points Total)
Category	Points
Functional Application	20
GenAI Integration	10
Containerization & Local Setup	10
CI/CD & Deployment	20
Monitoring & Observability	10
Testing & Engineering Process	20
Documentation & Weekly Reporting	10
Final Presentation	Pass/Fail
Bonus	Up to +5
⚠️ Important
❗️ If team contributions are not reasonably distributed and documented well in the Artemis Communication Channel and Confluence Weekly Reports, then communication is not transparent, or you cannot confidently explain your work during the presentation, your project will be graded as failed. ❗️
1. 🧩 Functional Application (20 Points)
Criteria	Points
End-to-end functionality between all components (client, server, database)	6
Smooth and usable user interface	4
REST API is clearly defined and matches functional needs	4
Server Side has at least 3 microservices	4
Application topic is appropriately chosen and fits project objectives	2
2. 🤖 GenAI Integration (10 Points)
Criteria	Points
GenAI module is well-embedded and fulfills a real user-facing purpose	4
Connects to cloud/local LLM	4
Modularity of the GenAI logic as a microservice	2
3. 🐳 Containerization & Local Setup (10 Points)
Criteria	Points
Each component is containerized and runnable in isolation	6
docker-compose.yml enables local development and testing with minimal effort and provides sane defaults (no complex env setup required)	4
4. 🔁 CI/CD & Deployment (20 Points)
Criteria	Points
CI pipeline with build, test, and Docker image generation via GitHub Actions	8
CD pipeline set up to automatically deploy to Kubernetes on main merge	6
Deployment works on our infrastructure (Rancher) and Cloud (AWS)	6
5. 📊 Monitoring & Observability (10 Points)
Criteria	Points
Prometheus integrated and collecting meaningful metrics	4
Grafana dashboards for system behavior visualization	4
At least one alert rule set up	2
6. 🧪 Testing & Structured Engineering Process (20 Points)
Criteria	Points
Test cases implemented for server/client and GenAI logic	6
Evidence of software engineering process: documented requirements, architecture models, such as top-level architecture, use case diagramm and analysis object model.	10
Tests run automatically in CI and cover key functionality	4
7. 📚 Documentation & Weekly Reporting (10 Points)
Criteria	Points
README.md and some parts in Confluence includes setup instructions, architecture overview, usage guide, and a clear mapping of student responsibilities	2
Documentation of CI/CD setup, and GenAI usage included	2
Deployment and local setup instructions are clear, reproducible, and platform-specific (≤3 commands for local setup, with sane defaults)	2
Subsystems have documented interfaces (API-driven deployment, e.g. Swagger/OpenAPI)	2
Monitoring instructions included in the documentation and exported as files	2
8. 🎤 Final Presentation (Pass/Fail)
Criteria	Points
All students present their own subsystem	Pass/Fail
Live demo of application and DevOps setup	Pass/Fail
Team reflects on what worked well, what didn’t, and answers follow-up technical questions	Pass/Fail
🏅 Bonus Points (up to +5)
Criteria	Points
Advanced Kubernetes use (e.g., self-healing, custom operators, auto-scaling)	+1
Full RAG pipeline implementation (with vector DB like Weaviate)	+1
Real-world-grade observability (e.g., log aggregation, tracing)	+1
Beautiful, original UI or impactful project topic	+1
Advanced monitoring setup with extensive and meaningful metrics (e.g., custom Prometheus exporters or Grafana dashboards with annotated insights)	+1




🎯 Project: Development, Deployment, and Scaling of a Web Application with GenAI Integration and Kubernetes Orchestration
🎯 Objective
In this course project, teams will design and implement a lightweight but technically complete web application. The goal is to apply modern DevOps principles including containerization, CI/CD automation, cloud-native deployment, observability, and AI integration.

The system must

Be built as a client-server application (client: React/Vue/Angular, server: Spring Boot)
Integrate a meaningful Generative AI (GenAI)
Be deployed to Kubernetes using GitHub Actions and Helm or raw manifests
Be observable with Prometheus and Grafana
Be collaboratively developed with documented ownership and clear workflows
The application domain is flexible but must meet all technical and process criteria.
The project aims to simulate real-world development scenarios by combining software engineering, DevOps automation, AI integration, and team collaboration.

⚠️ Deadline for project: 18 July 2025
👥 Organization and Collaboration
Aspect	Details
Team Size	3 students per team
Registration	Each student must provide: GitHub username, TUMonline login, matriculation number for accurate contribution tracking
Tutor Assignment	Each team will be supervised by a tutor for technical guidance and evaluation
Subsystem Ownership	Responsibility must be clearly assigned to students (server, client, or GenAI) and documented, but collaborative co-development is explicitly encouraged.
Contribution Tracking	Must be visible via GitHub commits, PR authorship, and participation in DevOps setup (CI/CD)
Weekly Sync	Status updates must be posted weekly via Confluence (Markdown table format)
Communication	Conducted via dedicated Artemis team channels (e.g., for tutor feedback, planning, or problem solving) and weekly status updates over confluence; No other communication channel will be taken into account!
📋 Status Table Format Example
Week	Status	Impediments	Promises
1	Implemented server API	Waiting for DB setup	Add unit tests
Teams are expected to engage in asynchronous communication, respond to tutor feedback promptly, and manage their collaboration like a real-world DevOps team.

💻 GitHub Collaboration Workflow
The project must be developed in a GitHub mono-repo
Work must be structured via Pull Requests (PRs):
Each feature or bugfix is developed in a feature branch
A PR must be submitted and reviewed before merging into main
Team members must peer-review and approve each other’s code
The CI/CD pipeline must:
Run automated tests on every PR
Automatically deploy to a Kubernetes environment on merge to main
🧩 Technical Requirements
🔨 Application Stack
Component	Technology	Notes
Server Side	Spring Boot (Java)	Must expose REST APIs and consist of at least 3 microservices. Use modular architecture.
Client Side	React, Angular, Vue.js	Usable, responsive UI that interacts with server over REST.
Database	MySQL or PostgreSQL or similar	Must support persistent storage. Schema must be documented. Run via Docker.
🧠 GenAI Integration
Requirement	Details
Language	Python
Deployment	Must be a modular microservice (containerized and networked with the server)
Functionality	Must fulfill a real user-facing use case (e.g., summarization, generation, Q&A)
LLM Support	Must support both cloud-based (OpenAI API) and local models (e.g., GPT4All, LLaMA)
Optional Bonus	Implement a full RAG architecture using a vector database like Weaviate
🐳 Containerization & Local Setup
Requirement	Details
Dockerization	All components (server, client, GenAI, DB) must have their own Dockerfile.
Compose File	A docker-compose.yml must exist for running the system end-to-end locally.
Setup Simplicity	Must be runnable in three or fewer commands (e.g., docker compose up). Sane defaults required — no complex manual ENV setup.
☸️ Kubernetes Deployment
Requirement	Details
Kubernetes	Must be deployable to a Kubernetes cluster using Helm or raw manifests
Supported Environments	Local infrastructure (Rancher) and a cloud option (AWS)
🔁 CI/CD Pipeline
Requirement	Details
Tooling	GitHub Actions
CI Tasks	Build and test all services, perform static analysis/linting
CD Tasks	Automatically deploy to Kubernetes on merge to main
Configuration	Must use secrets and support environment-specific variables. Deployment should be reproducible and maintainable.
📊 Monitoring & Observability
Tool	Purpose	Requirements
Prometheus	Metrics collection	Track at least: request count, latency, and error rate
Grafana	Visualization	Dashboards must reflect key system metrics (server, GenAI). Must be submitted as .json
Alerting	Notifications	At least one meaningful alert rule (e.g., service down, slow response time)
🧪 Testing & Process
Item	Requirement
Unit Tests	Must cover critical server and GenAI logic
Client Tests	Should cover core workflows and interactions
CI Testing	All tests must run automatically in the CI pipeline
Architecture Diagrams	Provide UML-style diagrams: Subsystem Decomposition & Use Case Diagram & Analysis Object Model are mandatory
API Design	Must provide OpenAPI/Swagger documentation and expose Swagger UI or equivalent
📦 Deliverables
Deliverable	Description
Source Code	Complete codebase for server, client, and GenAI services
Docker Setup	Dockerfiles and docker-compose.yml for local setup
Kubernetes Deployment	Helm charts or raw Kubernetes YAMLs with setup instructions
Monitoring Configuration	Prometheus + Grafana config with exported dashboards and alert rules (files required)
Testing Suite	Unit/integration tests with instructions to run them
Documentation	In README.md: setup guide, architecture diagrams, API docs, CI/CD/monitoring instructions, student responsibilities
Weekly Reports	Markdown tables with weekly progress, impediments, and promises
Final Presentation	10–15 minute live demo. Each student must present and explain their subsystem and be ready for Q&A



bana verilen feedback:


Markdown Handling:
When the user clicks on a specific day, the workout is shown in Markdown format — but this content comes directly from the client. There's no manual file upload involved. The frontend just renders a Markdown string, so the backend should be set up to receive and handle that directly, not expect a separate Markdown file.

Audio Conversion from Markdown:
Markdown is just a formatting syntax — here it's used to display workouts in a table format. It’s not something you can directly convert to MP3. You’d first need to turn that structured content into plain, readable text that actually makes sense when spoken. Maybe we could use AI for that part.

Backend Technology:
I saw you used FastAPI, but we’re not allowed to use Python or FastAPI for backend services. As covered in the course, we should be using an API Gateway and a Service Registry, and our microservices should be implemented in Java.
