# XenoPulse AI 🚀

**AI-powered CRM and Marketing Campaign Platform**

> Segment customers, generate AI campaigns, launch multi-channel communications, and track conversions — all in one place.

---

## Architecture

```
xenopulse-ai-main/
├── backend/          # FastAPI — Core API (port 8000)
├── channel-service/  # FastAPI — Message delivery simulator (port 8001)
└── frontend/         # Next.js 16 — Web UI (port 3000)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python, FastAPI, SQLAlchemy, SQLite |
| AI | Google Gemini 2.5 Flash |
| Channel Service | FastAPI, background tasks |
| Frontend | Next.js 16, React 19, TailwindCSS v4 |

---

## Features

- 🤖 **AI Workspace** — Conversational agent that identifies customer segments, generates campaign strategies, and drafts messages via Gemini AI
- 📢 **Campaign Management** — Launch multi-channel campaigns (WhatsApp / Email / SMS) with audience targeting
- 📊 **Analytics Dashboard** — Live delivery funnel, audience insights, communication logs
- 🔄 **Delivery Simulation** — Channel service simulates real-world delivery lifecycle: `PENDING → DELIVERED → OPENED → CLICKED → CONVERTED`
- 👥 **Customer Segmentation** — Identifies inactive customers, computes spend, channel preferences, and top categories

---

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/Saketrajak/xenopulse-ai-main.git
cd xenopulse-ai-main
```

### 2. Set up Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env from the example
cp .env.example .env
# Add your Gemini API key to .env
# Get it from: https://aistudio.google.com/app/apikey
```

### 3. Start all 3 services (3 separate terminals)

**Terminal 1 — Backend API**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Channel Service**
```bash
cd channel-service
uvicorn main:app --reload --port 8001
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

### 4. Load Demo Data
```bash
curl -X POST http://localhost:8000/demo/load
```
Or visit `http://localhost:8000/docs` → `/demo/load` → Execute

### 5. Open the app
👉 **http://localhost:3000**

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health check |
| `/stats` | GET | Customer & order counts |
| `/demo/load` | POST | Load 500 customers + 5000 orders |
| `/audience/preview` | GET | Inactive customer segment insights |
| `/campaigns/launch` | POST | Launch a campaign |
| `/campaigns/{id}/analytics` | GET | Campaign delivery analytics |
| `/agent/chat` | POST | AI agent conversation |
| `/agent/use-demo` | POST | Analyze demo data |
| `/agent/generate-campaign` | POST | Generate AI campaign draft |
| `/communications/receipt` | POST | Receive delivery callback from channel service |
| `/communications/debug` | GET | Recent communication logs |

Interactive docs: **http://localhost:8000/docs**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |

---

## Project Structure

```
backend/
├── main.py                    # FastAPI app + CORS
├── requirements.txt           # Python dependencies
├── generate_demo_data.py      # Regenerate CSVs
├── data/
│   ├── customers.csv          # 500 demo customers
│   └── orders.csv             # 5000 demo orders
├── database/database.py       # SQLite + SQLAlchemy
├── models/                    # ORM models
├── routes/                    # API route handlers
└── services/                  # Business logic

channel-service/
└── main.py                    # Delivery simulation

frontend/
└── app/
    ├── page.js                # Workspace (AI Chat)
    ├── campaigns/page.js      # Campaign management
    ├── analytics/page.js      # Analytics dashboard
    ├── components/Sidebar.js  # Navigation
    └── lib/api.js             # Backend API client
```

---

## License

MIT
