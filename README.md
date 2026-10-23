# E Predict — AI-Based Deployment Error Prediction System

A modern, responsive full-stack web application designed to help developers and DevOps teams identify errors and potential deployment issues in software projects *before* deployment. Built with a minimal, elegant **Light Lavender** AI dashboard theme (`#F5F3FF` background, `#FFFFFF` cards, `#8B78C6` accent, `#E9E2FF` highlights, `#302B43` text).

Users can register, create and manage projects, upload complete project source archives as ZIP files, analyze code and configuration files without executing untrusted code on the host, receive AI-powered explanations with side-by-side diffs, track issues and tasks, and export executive PDF deployment audit reports.

---

## 🌟 Key Capabilities

1. **User Authentication & Scoped Dashboards**
   - Secure account registration and login using JWT and Bcrypt password hashing.
   - Strict tenant isolation: users only access their own projects, scan reports, tasks, and files.

2. **Real Code & Configuration Static Analysis (No Host Execution)**
   - **Safe Sandboxed Extraction**: Enforces Zip Slip path-traversal prevention, limits archive file count (1,500 max) and uncompressed byte size (200MB max).
   - **Dependency Inspection**: Cross-references imported modules in JS/TS and Python AST against `package.json` and `requirements.txt`. Flags undeclared imports and non-deterministic wildcard versions (`*`, `latest`).
   - **Environment Variable Verification**: Validates `process.env` and `os.environ` references against `.env` and `.env.example` templates.
   - **Port & Network Safety**: Detects hardcoded server ports (e.g., `app.listen(5000)`) missing dynamic cloud `process.env.PORT` fallbacks, and identifies hazardous loopback bindings (`127.0.0.1` / `localhost`) that block container ingress.
   - **Dockerfile & Containerization Audit**: Verifies `WORKDIR`, `EXPOSE`, `CMD` / `ENTRYPOINT`, and checks for missing `.dockerignore` when using `COPY . .`.
   - **Cloud & AWS Verification**: Flags missing Application Load Balancer health check endpoints (`/health`), missing Beanstalk `Procfile` / `buildspec.yml`, and detects leaked AWS keys (`AKIA...`) or database passwords.
   - **Syntax & Integrity**: AST syntax verification for JavaScript and Python, JSON validation for manifests, and YAML parser checking for indentation errors.

3. **Deployment Readiness Score (0 to 100)**
   - Objective, documented mathematical calculation:
     $$\text{Score} = \max(0, \min(100, 100 - (\text{Critical} \times 25) - (\text{High} \times 12) - (\text{Medium} \times 6) - (\text{Low} \times 2)))$$
   - Hard capped at 45% if any Critical deployment blockers exist.
   - Detailed justification explaining why the score was assigned, with clear passed validation counts.

4. **AI Error Explanation & Side-by-Side Fixes**
   - Simple English explanations and root-cause analysis.
   - Side-by-side code diff displaying the original hazardous snippet alongside the suggested fix.
   - Step-by-step remediation guide and production best practices.
   - Copy-to-clipboard for quick resolution. Never mutates user projects without explicit confirmation.
   - Compatible with Google Gemini API, with a domain-specific fallback engine when API keys are not supplied.

5. **Issue & Task Tracking (Kanban Workflow)**
   - Categorize issues by status: `Open`, `In Progress`, `Resolved`, `Reopened`.
   - One-click creation of deployment tasks directly from detected issues.
   - Kanban board with Todo, In Progress, and Completed states, deadline tracking, and priority filters.

6. **Historical Audits & Downloadable PDF Reports**
   - Chronological scan timeline tracking readiness progression and issue delta trends over time.
   - Server-side PDF report generator producing executive deployment audit certificates for stakeholders.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons, Recharts, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **Code Parsers**:
  - Node.js AST Parser: `acorn`, `acorn-walk`
  - YAML Parser: `yaml`
  - Python AST Analyzer: Python `ast`, `os.walk`, regex
  - Archive Engine: `adm-zip`
- **PDF Generation**: `pdfkit`
- **Authentication**: `jsonwebtoken`, `bcryptjs`
- **AI Integration**: Google Gemini API (`@google/generative-ai` / REST) with smart contextual fallback.

---

## 📁 Project Structure

```
ai-deployment-error-predictor/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── middleware/
│   │   ├── auth.js               # JWT bearer verification middleware
│   │   └── upload.js             # Multer upload validation & storage
│   ├── models/
│   │   ├── User.js               # User accounts & bcrypt hashing
│   │   ├── Project.js            # Software project records
│   │   ├── Analysis.js           # Pre-deployment scan records & scores
│   │   ├── Issue.js              # Detected findings & AI explanations
│   │   └── Task.js               # Deployment action tasks
│   ├── routes/
│   │   ├── authRoutes.js         # Register, login, profile routes
│   │   ├── projectRoutes.js      # Project management & dashboard metrics
│   │   ├── analysisRoutes.js     # Upload ZIP & trigger static analysis
│   │   ├── issueRoutes.js        # Filter & update issue statuses
│   │   ├── taskRoutes.js         # Kanban task CRUD
│   │   ├── aiRoutes.js           # Conversational DevOps AI assistant
│   │   └── reportRoutes.js       # PDF generation & history timeline
│   ├── services/
│   │   ├── zipExtractor.js       # Safe extraction (Zip Slip protection)
│   │   ├── analyzerEngine.js     # Master scan coordinator & readiness calculator
│   │   ├── ruleEngine.js         # Multi-language static & heuristic rules
│   │   ├── aiService.js          # Gemini API & contextual explanation generator
│   │   └── pdfService.js         # PDFKit report layout generator
│   ├── python_analyzer/
│   │   └── analyze.py            # Python AST & dependency inspector
│   ├── samples/                  # Pre-packaged test project ZIPs
│   │   ├── sample-node-project.zip
│   │   └── sample-python-project.zip
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js         # Axios client with JWT interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ReadinessGauge.jsx# SVG score meter
│   │   │   ├── SeverityBadge.jsx # Severity & type indicators
│   │   │   ├── CodeDiffModal.jsx # Side-by-side original vs fix view
│   │   │   └── TaskModal.jsx     # Task creation modal
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MyProjectsPage.jsx
│   │   │   ├── CreateProjectPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   ├── UploadZipPage.jsx
│   │   │   ├── AnalysisResultsPage.jsx
│   │   │   ├── IssueDetailsPage.jsx
│   │   │   ├── AIAssistantPage.jsx
│   │   │   ├── TaskManagementPage.jsx
│   │   │   ├── ProjectHistoryPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (v24 tested)
- **MongoDB**: Running locally on port `27017` or a MongoDB Atlas URI
- **Python**: v3.10+ (for Python project AST inspection)

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` based on `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_deployment_error_predictor
JWT_SECRET=super_secret_ai_deployment_error_prediction_key_2026
GEMINI_API_KEY=your_optional_gemini_api_key_here
PYTHON_PATH=C:\Users\SURYA\AppData\Local\Programs\Python\Python313\python.exe
```

Start the backend server:
```bash
npm start
```
*Backend runs on `http://localhost:5000`.*

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 Testing with Sample Projects

The system includes two pre-packaged archives in `backend/samples/`:

1. **`sample-node-project.zip`**
   - Missing dependency `axios` imported in `server.js` but missing from `package.json`.
   - Server listens on hardcoded port 5000 and loopback `127.0.0.1`.
   - Missing `"start"` script in `package.json`.
   - Wildcard dependency `"cors": "*"`.
   - Hardcoded AWS Access Key in source code.
   - Missing `EXPOSE` and `CMD` in Dockerfile.

2. **`sample-python-project.zip`**
   - Missing dependency `requests` imported in `app.py` but absent from `requirements.txt`.
   - Hardcoded `DEBUG = True` in production code.
   - Plaintext database credentials in connection URI.
   - Server listens on loopback `127.0.0.1`.

You can download either sample directly from the **Landing Page** or **Upload ZIP Page**, upload it to any project, and review the resulting **Readiness Score**, **Side-by-Side Fixes**, and **PDF Reports**.
