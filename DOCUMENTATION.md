# CuraLink — Complete Project Documentation

> A full-stack DICOM archive management and viewer system built on top of dcm4chee-arc, with AI-powered smart search.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technologies Used](#3-technologies-used)
4. [Project Structure](#4-project-structure)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Frontend — React](#6-frontend--react)
7. [AI Smart Search](#7-ai-smart-search)
8. [Authentication & Permissions](#8-authentication--permissions)
9. [API Reference](#9-api-reference)
10. [Environment Variables](#10-environment-variables)
11. [Deployment](#11-deployment)

---

## 1. Project Overview

**CuraLink** is a web-based DICOM archive management dashboard that acts as a unified interface over a [dcm4chee-arc](https://github.com/dcm4che/dcm4chee-arc-light) installation. It provides:

- Hospital/institution dashboards grouped by DICOM `InstitutionName`
- Patient and study search with fuzzy matching
- DICOM configuration management (routing rules, transform rules, export rules, devices, AEs, HL7)
- User management with granular permission control
- AI-powered natural language search using a local Qwen model via Ollama
- A floating AI chat assistant available on every page

**Production URL:** `https://curalink.nextasolutions.net`
**Backend port:** `8000` (FastAPI/uvicorn)
**Frontend port:** `5173` (Vite dev server)

---

## 2. Architecture

```
Browser
   │
   ▼
Nginx (HTTPS :443)
   ├── /api/*  ──────────────────► FastAPI (localhost:8000)
   │                                    │
   │                                    ├── Keycloak (HTTPS :8843)  ← Auth tokens
   │                                    │     (172.16.16.221)
   │                                    │
   │                                    ├── dcm4chee-arc (HTTP :8080) ← DICOM data
   │                                    │     (172.16.16.221)
   │                                    │
   │                                    ├── SQLite (local file)       ← App users
   │                                    │
   │                                    └── Ollama (localhost:11434)  ← AI / Qwen
   │
   └── /* ───────────────────────► React SPA (Vite build in /var/www/curalink)
```

**Request flow:**

1. Browser sends all API calls to `/api/*` on the same origin.
2. Nginx proxies them to FastAPI on `localhost:8000`.
3. FastAPI authenticates with Keycloak (password grant, cached token) and forwards requests to dcm4chee-arc.
4. DICOM responses are transformed and returned as clean JSON.
5. React renders the data.

---

## 3. Technologies Used

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.9 | Runtime language |
| **FastAPI** | Latest | REST API framework — async, auto-docs, type-safe |
| **uvicorn** | Latest | ASGI server that runs FastAPI |
| **httpx** | Latest | Async HTTP client for dcm4chee / Keycloak requests |
| **LangChain** | Latest (`langchain-core`, `langchain-ollama`) | LLM orchestration framework for AI search |
| **SQLite** | Built-in (stdlib `sqlite3`) | Local database for CuraLink user accounts |
| **Keycloak** | Server at `172.16.16.221:8843` | Identity provider — issues tokens for dcm4chee |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2 | UI component library |
| **Vite** | Latest | Build tool and dev server |
| **React Router DOM** | 7.12 | Client-side routing (SPA) |
| **Tailwind CSS** | 3.4.19 | Utility-first CSS framework |
| **Recharts** | 3.7 | Chart library (modality breakdown, study trends) |
| **Lucide React** | 0.562 | Icon library |
| **Font Awesome** | 7.2 | Icon library (sidebar, buttons, badges) |
| **Montserrat / Lato** | Fontsource | Custom fonts |
| **PostCSS** | Latest | CSS processing pipeline for Tailwind |
| **ESLint** | Latest | Code linting |

### Infrastructure & DICOM

| Technology | Purpose |
|---|---|
| **dcm4chee-arc** | DICOM archive — stores studies, series, instances |
| **Keycloak** | OAuth2 / OpenID Connect identity server |
| **Nginx** | Reverse proxy, SSL termination, static file serving |
| **Let's Encrypt** | SSL/TLS certificate authority |
| **Ollama** | Local LLM runner (serves Qwen model via REST) |
| **Qwen 2.5** | Open-source LLM by Alibaba — used for AI Q&A |

### DICOM Standards

| Standard | Usage |
|---|---|
| **QIDO-RS** | Query DICOM objects (studies, series, patients) via REST |
| **DICOM JSON** | Wire format for DICOM attribute transfer |
| **HL7** | Healthcare messaging protocol (HL7 apps config) |
| **MWL (Modality Worklist)** | Scheduled procedure step queries |

---

## 4. Project Structure

```
dcm/
├── app.py                        # FastAPI app — all route handlers
├── app_state.py                  # Shared config, httpx client, helpers
├── routers/
│   ├── __init__.py
│   └── smart_search.py           # /api/quick-search + /api/smart-search
├── DEPLOYMENT.md                 # Deployment guide
├── DOCUMENTATION.md              # This file
├── nginx-curalink-updated.conf   # Production Nginx config
└── dcm4chee-viewer/              # React frontend
    ├── .env                      # Dev env vars
    ├── .env.production           # Prod env vars
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx               # Root: router, layout, global components
        ├── main.jsx              # React entry point
        ├── config/
        │   └── permissions.js   # Permission IDs, helpers
        ├── services/
        │   └── dcmchee.js       # All API calls + data transformers
        ├── components/
        │   ├── navbar.jsx        # Sidebar navigation (permission-filtered)
        │   ├── FloatingChat.jsx  # Global AI chat widget (bottom-right FAB)
        │   ├── background.jsx    # Decorative background
        │   ├── patientSearch.jsx # Patient search form + results table
        │   ├── studiesBox.jsx    # Studies search form + results table
        │   ├── seriesSearch.jsx  # Series search form + results table
        │   ├── MWLSearch.jsx     # Modality worklist search
        │   ├── singleHospital.jsx# Per-hospital dashboard view
        │   ├── sidebar.jsx       # Secondary sidebar
        │   ├── inputScreen.jsx   # Input screen component
        │   └── Protectedroute.jsx# Route guard wrapper
        └── pages/
            ├── LoginPage.jsx
            ├── DCMDashboard.jsx
            ├── SmartSearchPage.jsx
            ├── PatientPage.jsx
            ├── studies.jsx
            ├── SeriesPage.jsx
            ├── mwl.jsx
            ├── DevicesPage.jsx
            ├── AppEntitiesList.jsx
            ├── AEListPage.jsx
            ├── HL7ApplicationPage.jsx
            ├── RoutingRolesPage.jsx
            ├── TransformRulesPage.jsx
            ├── ExportRulesPage.jsx
            └── UsersPage.jsx
```

---

## 5. Backend — FastAPI

### `app_state.py` — Shared State

All configuration, the shared HTTP client, caches, and DICOM helper functions live here. Both `app.py` and router modules import from this file to avoid circular imports.

**Contents:**

```python
# Config (all overridable via env vars)
KEYCLOAK_URL            = "https://172.16.16.221:8843"
DCM4CHEE_URL            = "http://172.16.16.221:8080"
USERNAME                = "root"          # dcm4chee service account
PASSWORD                = "changeit"
KEYCLOAK_ADMIN_USERNAME = "admin"         # Keycloak master realm admin
KEYCLOAK_ADMIN_PASSWORD = "admin"
OLLAMA_URL              = "http://localhost:11434"
OLLAMA_MODEL            = "qwen2.5"
DEFAULT_WEBAPP          = "DCM4CHEE"

# Shared HTTP client (one instance, SSL verification disabled for self-signed certs)
client = httpx.AsyncClient(verify=False, timeout=30.0)

# In-memory caches
_token_cache      # Keycloak bearer token (re-fetched when expired)
_hospitals_cache  # Institution list (TTL: 5 minutes)
```

**Key functions:**

| Function | Description |
|---|---|
| `get_token()` | Fetches/caches a Keycloak bearer token via password grant |
| `get_webapp_path(webapp)` | Returns `/dcm4chee-arc/aets/{webapp}/rs` |
| `clean_query_params(qs)` | Strips internal params (e.g. `webAppService`) before forwarding |
| `_gv(obj, tag, idx)` | Extracts a value from a DICOM JSON object by tag (e.g. `"00100010"`) |
| `_fmt_date(raw)` | Converts `YYYYMMDD` → `YYYY-MM-DD` |
| `_fetch_all_series(token, path)` | Paginates through ALL series (limit/offset loop) |
| `_fetch_all_studies_sup(token, path)` | Paginates through ALL studies for supplemental data |
| `_build_institutions_from_series(series, studies)` | Groups series by `InstitutionName` (tag `00080080`) into institution cards |
| `fetch_hospitals_cached()` | Calls the two fetch functions in parallel, builds institution list, caches 5 min |

### `app.py` — Route Handlers

`app.py` only contains route handlers. It imports all shared state from `app_state.py` and includes the smart search router.

```python
from app_state import (DCM4CHEE_URL, DEFAULT_WEBAPP, client, get_token, ...)
from routers.smart_search import router as smart_search_router

app = FastAPI()
app.include_router(smart_search_router, prefix="/api")
```

### `routers/smart_search.py` — AI Router

A FastAPI `APIRouter` that handles both quick search and LLM-powered Q&A.

**`GET /api/quick-search?q=`**

Fires three requests in parallel using `asyncio.gather`:
1. Patient search by name (fuzzy)
2. Patient search by ID (wildcard)
3. Study search by patient name (fuzzy)

Deduplicates results and returns top 8 of each.

**`POST /api/smart-search`**

1. Reads the question and prior chat history from the request body.
2. Builds a context string from live dcm4chee data based on keywords in the question:
   - Always: institution summary (name, studies count, patients count)
   - If question mentions "study/scan/recent": fetch 10 most recent studies
   - If question mentions "patient/find/who": fetch recent patients list
   - If question mentions "modality/CT/MR/…": fetch available modalities
3. Constructs a `SystemMessage` with the context, plus `HumanMessage`/`AIMessage` for history.
4. Calls `ChatOllama.invoke()` in a thread executor (since LangChain is synchronous).
5. Returns `{ answer, model }`.

---

## 6. Frontend — React

### Routing (`App.jsx`)

Uses React Router v6 with lazy loading for all pages. Two route guard components:

```jsx
<PermRoute permId="dashboard">  // checks hasPermission(permId)
<AdminRoute>                    // checks isAdmin === 'true' in localStorage
```

**Route table:**

| Path | Component | Guard |
|---|---|---|
| `/login` | LoginPage | None |
| `/dashboard` | DCMDashboard | `dashboard` permission |
| `/hospital/:id` | singleHospital | `dashboard` permission |
| `/smart-search` | SmartSearchPage | None |
| `/patients` | PatientPage | `patients` permission |
| `/studies` | studies | `studies` permission |
| `/series` | SeriesPage | None |
| `/mwl` | mwl | None |
| `/devices` | DevicesPage | `devices` permission |
| `/app-entities` | AppEntitiesList | `app-entities` permission |
| `/ae-list` | AEListPage | `app-entities` permission |
| `/hl7-application` | HL7ApplicationPage | `hl7-application` permission |
| `/routing-roles` | RoutingRolesPage | `routing-rules` permission |
| `/transform-rules` | TransformRulesPage | `transform-rules` permission |
| `/export-rules` | ExportRulesPage | `export-rules` permission |
| `/users` | UsersPage | Admin only |

### Pages

#### `LoginPage.jsx`
- Standard username/password form
- "Remember me" checkbox (stores credentials in localStorage)
- **"Continue as Demo"** button — bypasses auth, sets all non-admin permissions, `authMode: demo`

#### `DCMDashboard.jsx`
Main overview page. Loads two data sources in parallel:
- `/api/dashboard` — recent studies for modality chart and series/instance counts
- `/api/hospitals` — institution cards with patient/study counts

Displays:
- Stat cards: Total Patients, Total Studies, Total Series, Total Instances
- Modality breakdown (Recharts bar/pie chart)
- Studies by date trend (Recharts line chart)
- Hospital/institution cards (expandable)
- Recent studies table

#### `SmartSearchPage.jsx`
Two-panel layout:
- **Left panel:** Real-time fuzzy search across patients and studies as you type (350ms debounce). Click results to navigate.
- **Right panel:** Full AI chat interface with Qwen. Typing animation, quick-prompt chips, multi-turn history, clear button.

#### `UsersPage.jsx`
Full user management UI:
- List all users with roles/permissions displayed
- Create user modal (username, email, first/last name, password, permissions checkboxes)
- Edit user (same fields)
- Delete user (confirm dialog)
- Permission assignment by section (Dashboard, Navigation, Configuration)

#### `ExportRulesPage.jsx`
Three-tab interface:
- **Exporters tab:** Configure export destinations (device, AE title, URI, queue name, storage ID)
- **Export Rules tab:** Create rules that trigger exports (entity, exporter ID, property filter, schedule, priority)
- **Export Tasks tab:** Live view of export task counts by status (Scheduled, In Process, Completed, Warning, Failed, Canceled)

#### `RoutingRolesPage.jsx`
Manage `dcmForwardRule` entries in dcm4chee device config:
- Table columns: Name, Description, Device, Local AE, Source AEs, Destination AEs, Queue, Property Filter, Priority, Status
- Inline add row with dropdowns populated from live dcm4chee data:
  - Device: `<select>` from `/api/devices`
  - Local AE: `<select>` from `/api/aes`
  - Source/Dest AEs: `<input list>` with datalist (autocomplete)

#### `TransformRulesPage.jsx`
Manages `dcmCoercionRule` entries — same pattern as routing rules but for DICOM attribute modification during transfer:
- Fields: Name, Description, Device, Local AE, Source AE pattern, Target URI (XSL file path), Gateway, Priority

### Components

#### `FloatingChat.jsx`
Floating action button (bottom-right, 52×52px circle with robot icon). When open:
- 480px tall chat panel with teal header
- Compact message bubbles (user = teal right, assistant = white left)
- Typing animation (3 bouncing dots)
- Quick-prompt chips when history is empty
- Persists conversation across page navigations (component stays mounted in App.jsx)
- Badge on FAB showing reply count when closed

#### `navbar.jsx`
Collapsible sidebar with permission-filtered sections:
- Dashboard → `/dashboard`
- Navigation → Smart Search, Patient, Studies
- Configuration → Devices, AEs, HL7, Routing, Transform, Export Rules
- Administration (admin only) → Users

### Services (`dcmchee.js`)

Single API client file. Base URL from `import.meta.env.VITE_API_BASE`.

**Data transformers** convert raw DICOM JSON tags to readable objects:

```js
// DICOM tag "00100010" (PatientName) with VR PN:
{ "00100010": { "vr": "PN", "Value": [{ "Alphabetic": "SMITH^JOHN" }] } }
// → { patientName: "JOHN SMITH" }
```

---

## 7. AI Smart Search

### How it works

```
User types question
        │
        ▼
POST /api/smart-search
        │
        ├── Detect keywords in question
        │       "study/scan"  → fetch 10 recent studies from dcm4chee
        │       "patient/who" → fetch recent patients list
        │       "modality/CT" → fetch modality list
        │       Always        → fetch institution summary
        │
        ├── Build context string (plain text)
        │
        ├── Construct LangChain messages:
        │       SystemMessage(context)
        │       + AIMessage/HumanMessage history (multi-turn)
        │       + HumanMessage(question)
        │
        └── ChatOllama.invoke(messages)
                │
                ▼
        Ollama at localhost:11434
                │
                ▼
        Qwen 2.5 model
                │
                ▼
        { answer, model } → browser
```

### Configuration

| Env Var | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen2.5` | Model name as listed in Ollama |

### Setup

```bash
# Install Ollama (https://ollama.com)
ollama pull qwen2.5       # download the model (~4.7 GB for 7B)
ollama serve              # start the Ollama server

# Then start the FastAPI backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

---

## 8. Authentication & Permissions

### Login flow

```
User submits credentials
        │
        ▼
POST /api/auth/login
        │
        ├── Check SQLite curalink_users.db
        ├── Verify password (SHA-256 hash)
        └── Return { user: { id, username, isAdmin, permissions[] } }
                │
                ▼
        Store in localStorage:
                authToken       = user.id
                authMode        = 'curalink'
                userEmail       = user.username
                isAdmin         = 'true' | 'false'
                userPermissions = JSON array of permission IDs
                isAuthenticated = 'true'
```

### Demo login

Bypasses the API entirely. Sets `authMode: demo`, grants all non-admin permissions, redirects to dashboard.

### Permission IDs

| ID | Screen |
|---|---|
| `dashboard` | Hospitals Dashboard |
| `patients` | Patient search |
| `studies` | Study search |
| `devices` | Devices configuration |
| `app-entities` | Application Entities (AE titles) |
| `hl7-application` | HL7 applications |
| `routing-rules` | Routing rules |
| `transform-rules` | Transform rules |
| `export-rules` | Export rules |

Admin users bypass all permission checks and also see the Users admin page.

### Keycloak token (dcm4chee access)

The backend uses its own service account (`root`/`changeit`) to talk to dcm4chee-arc. It fetches a Keycloak token once and caches it for 80% of its lifetime (default: ~4 minutes). This token is attached as `Authorization: Bearer <token>` on every dcm4chee request.

---

## 9. API Reference

### Hospitals

| Method | Path | Description |
|---|---|---|
| GET | `/api/hospitals` | List institutions built from DICOM `InstitutionName` (series+studies, cached 5 min) |
| GET | `/api/hospitals/{id}` | Get single institution by numeric ID |

**Institution object:**
```json
{
  "id": 1,
  "name": "AIN SHAMS GENERAL HOSPITAL",
  "institutionName": "AIN SHAMS GENERAL HOSPITAL",
  "address": "",
  "status": "active",
  "studyCount": 142,
  "patientCount": 89,
  "modalities": ["CT", "MR", "US"],
  "departments": ["RADIOLOGY"],
  "lastStudyDate": "2026-02-20"
}
```

### Patients

| Method | Path | Params |
|---|---|---|
| GET | `/api/patients` | `PatientName`, `PatientID`, `fuzzymatching`, `limit`, `offset`, `orderby`, `webAppService` |
| GET | `/api/patients/{id}/studies` | `webAppService` |

### Studies

| Method | Path | Params |
|---|---|---|
| GET | `/api/studies` | All QIDO-RS study parameters + `webAppService` |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Global stats (last 200 studies) |
| GET | `/api/dashboard/hospital/{id}` | Per-hospital stats |

**Stats object:**
```json
{
  "totalStudies": 200,
  "totalPatients": 145,
  "totalSeries": 890,
  "totalInstances": 12400,
  "studiesByModality": [{ "modality": "CT", "count": 80 }],
  "studiesByDate": [{ "date": "2026-02-20", "count": 12 }],
  "recentStudies": [...]
}
```

### Configuration

| Method | Path | Description |
|---|---|---|
| GET | `/api/devices` | List dcm4chee devices |
| GET | `/api/aes` | List AE titles |
| GET | `/api/hl7apps` | List HL7 applications |
| GET | `/api/modalities` | List modalities seen in archive |
| GET | `/api/webapps` | List QIDO-RS web applications |

### Routing Rules

| Method | Path | Body |
|---|---|---|
| GET | `/api/routing-rules` | — |
| POST | `/api/routing-rules` | `{ cn, description, deviceName, localAETitle, sourceAETitle, destAETitle, queueName, bind, priority }` |

### Transform Rules

| Method | Path | Body |
|---|---|---|
| GET | `/api/transform-rules` | — |
| POST | `/api/transform-rules` | `{ cn, description, localAETitle, sourceAE, target, gateway, priority }` |

### Export Rules

| Method | Path | Body |
|---|---|---|
| GET | `/api/exporters` | — |
| POST | `/api/exporters` | `{ deviceName, exporterID, aeTitle, uri, queueName, storageID, description }` |
| GET | `/api/export-rules` | — |
| POST | `/api/export-rules` | `{ cn, description, deviceName, exporterID, entity, property, priority }` |
| DELETE | `/api/export-rules/{cn}` | `?deviceName=` |
| GET | `/api/export-tasks` | Returns counts: `{ SCHEDULED, IN PROCESS, COMPLETED, WARNING, FAILED, CANCELED }` |

### Smart Search

| Method | Path | Body / Params |
|---|---|---|
| GET | `/api/quick-search` | `?q=search+term` |
| POST | `/api/smart-search` | `{ question: "...", history: [{role, content}] }` |

**Quick search response:**
```json
{
  "patients": [{ "patientId": "12345", "patientName": "AHMED MOHAMED" }],
  "studies":  [{ "studyInstanceUID": "...", "patientName": "...", "modality": "CT", "studyDate": "2026-02-20" }]
}
```

**Smart search response:**
```json
{ "answer": "The archive contains 142 studies...", "model": "qwen2.5" }
```

### User Management

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with username + password |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user (profile, permissions, password) |
| DELETE | `/api/users/{id}` | Delete user |

### Health

| Method | Path | Response |
|---|---|---|
| GET | `/health` | `{ "status": "ok", "service": "dcm4chee-arc" }` |

---

## 10. Environment Variables

### Backend (`app_state.py`)

| Variable | Default | Description |
|---|---|---|
| `KEYCLOAK_URL` | `https://172.16.16.221:8843` | Keycloak server URL |
| `DCM4CHEE_URL` | `http://172.16.16.221:8080` | dcm4chee-arc server URL |
| `DCM4CHEE_USERNAME` | `root` | Service account username for dcm4chee token |
| `DCM4CHEE_PASSWORD` | `changeit` | Service account password |
| `KEYCLOAK_ADMIN_USERNAME` | `admin` | Keycloak master realm admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | `admin` | Keycloak master realm admin password |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen2.5` | Ollama model name to use |
| `DEFAULT_WEBAPP` | `DCM4CHEE` | Default QIDO-RS web app name |
| `CURALINK_DB_PATH` | `curalink_users.db` | Path to the SQLite user database |

### Frontend (`dcm4chee-viewer/.env`)

| Variable | Dev Value | Prod Value |
|---|---|---|
| `VITE_API_BASE` | `http://172.16.16.221:8000/api` | `https://curalink.nextasolutions.net/api` |

---

## 11. Deployment

### Start backend (development)

```bash
cd "c:\Users\Ahmed Mohamed\Documents\dcm"
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Start frontend (development)

```bash
cd dcm4chee-viewer
npm install
npm run dev
# Accessible at http://localhost:5173
```

### Build for production

```bash
cd dcm4chee-viewer
npm run build
# Output: dcm4chee-viewer/dist/
```

Copy dist to server:

```bash
scp -r dist/* user@server:/var/www/curalink/
```

### Nginx configuration

The production Nginx config (`nginx-curalink-updated.conf`):

```
HTTP :80  → redirect to HTTPS
HTTPS :443
  /api/*   → proxy to localhost:8000
  /health  → proxy to localhost:8000
  /*       → serve /var/www/curalink (React SPA with try_files fallback)

SSL: Let's Encrypt at /etc/letsencrypt/live/curalink.nextasolutions.net/
Gzip: enabled for HTML, CSS, JS, JSON, SVG
Cache: 1 year for static assets (immutable)
Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
```

### SystemD service (production backend)

```ini
[Unit]
Description=CuraLink DICOM API
After=network.target

[Service]
WorkingDirectory=/path/to/dcm
ExecStart=uvicorn app:app --host 127.0.0.1 --port 8000
Restart=always
Environment=DCM4CHEE_USERNAME=root
Environment=DCM4CHEE_PASSWORD=changeit

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable dcm-api
systemctl start dcm-api
```

### Required Python packages

```bash
pip install fastapi uvicorn httpx langchain-core langchain-ollama
```

### Verify deployment

```bash
curl https://curalink.nextasolutions.net/health
# → {"status":"ok","service":"dcm4chee-arc"}

curl https://curalink.nextasolutions.net/api/hospitals
# → [...institution list...]
```

---

*Last updated: February 2026*
