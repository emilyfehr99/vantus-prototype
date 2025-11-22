# ⚡ Velocity Logic Agent

**Turn Emails into Estimates Instantly.**

A production-ready AI-powered quoting system with a premium Apple-inspired interface. The agent monitors Gmail, uses AI to understand customer requests, generates professional PDF quotes, and requires human approval before sending—putting you in control.

![Dashboard](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai)

---

## ✨ Features

### 🎯 Core Capabilities
- **📧 Gmail Integration**: Monitors inbox for new quote requests
- **🤖 AI-Powered Intent Parsing**: Uses OpenAI GPT-4 to extract customer needs
- **💰 Smart Pricing Engine**: Fuzzy matching against your pricing database
- **📄 Dynamic PDF Generation**: Professional quotes with your company branding
- **👤 Human-in-the-Loop**: All quotes require approval before sending

### 🎨 Premium UI (React + Tailwind)
- **Apple-Inspired Design**: Clean, modern, glassmorphism aesthetic
- **Dashboard**: Visual analytics, revenue charts, activity feed
- **UX Psychology**: Urgency indicators, color-coded priorities, micro-animations
- **Draft Editor**: Edit line items, quantities, and prices before approval
- **Settings**: Company profile, logo upload, pricing CSV import

### 🔧 Powerful Features
- **Dynamic Company Branding**: Your logo and info on every quote
- **Activity Feed**: Live log of all agent actions
- **Revenue Analytics**: Visual insights into pending and approved quotes
- **Import/Export**: Upload pricing via CSV, download quote history

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key
- Google Cloud Project (for Gmail)

### 1. Install Dependencies

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.template .env
```

Edit `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

### 3. Setup Gmail API

Follow the detailed instructions in [`setup_guide.md`](./setup_guide.md) to:
1. Create Google Cloud Project
2. Enable Gmail API
3. Generate `credentials.json`
4. Complete OAuth flow

**Note**: Without Gmail credentials, the agent runs in **Mock Mode** (simulated emails).

### 4. Run the Application

**Start Backend (Terminal 1):**
```bash
python3 web_interface.py
```
Backend runs on `http://localhost:5001`

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5002`

**Open Dashboard:**
Navigate to `http://localhost:5002` in your browser.

---

## 📁 Project Structure

```
velocity-logic-agent/
├── main.py                          # Core agent orchestration
├── web_interface.py                 # Flask API backend
├── services/
│   ├── llm_service.py               # OpenAI GPT-4 integration
│   ├── pricing_engine.py            # Pricing calculations & fuzzy matching
│   ├── pdf_service.py               # PDF generation with branding
│   └── gmail_service.py             # Gmail API integration
├── data/
│   └── pricing.csv                  # Your pricing database
├── frontend/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Main dashboard with HITL
│   │   │   ├── QuoteGenerator.jsx   # Manual quote creation
│   │   │   ├── History.jsx          # Quote history
│   │   │   └── Settings.jsx         # Company profile & pricing
│   │   └── index.css                # Tailwind + custom styles
│   └── public/
│       └── uploads/                 # Uploaded logos
├── output/                          # Generated PDF quotes
├── drafts.json                      # Draft quote storage
├── settings.json                    # Company profile settings
├── setup_guide.md                   # Detailed API setup instructions
└── README.md                        # This file
```

---

## 🎯 How It Works

### Human-in-the-Loop Workflow

```
┌──────────────┐
│ New Email    │
│ Arrives      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ AI Parses Intent │ ← OpenAI GPT-4
│ (Customer, Items) │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Pricing Engine   │ ← Fuzzy Match
│ Calculates Quote │    to pricing.csv
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Generate PDF     │ ← Your Logo
│ with Branding    │   & Company Info
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Save as DRAFT    │ ★ APPROVAL REQUIRED
│ (Dashboard)      │
└──────┬───────────┘
       │
       ▼ [You Review & Edit]
       │
       ▼
┌──────────────────┐
│ Approve & Send   │ → Gmail Draft
│ to Customer      │
└──────────────────┘
```

---

## 🎨 Dashboard Features

### Action-First Layout (UX Psychology)
- **Priority 1**: Pending Approvals (requires decision)
- **Priority 2**: Status Metrics (health check)
- **Priority 3**: Analytics (insights)

### Urgency Indicators
- 🔴 **Critical** (24+ hours old): Red gradient, "Urgent" badge
- 🟠 **High** (4-24 hours old): Orange gradient, "Needs Review" badge
- 🔵 **Normal** (<4 hours old): Blue gradient

### Micro-Animations
- Cards lift on hover
- Icons scale up
- Buttons glow brighter
- Smooth transitions everywhere

---

## ⚙️ Configuration

### Company Branding
Navigate to **Settings > Company Profile**:
- Company Name
- Tagline
- Address, Phone, Email, Website
- **Upload Logo** (PNG/JPG)

### Pricing Database
Navigate to **Settings > Pricing Data**:
- **Upload CSV** with format:
  ```csv
  Service Name,Keywords,Unit Price,Unit,Description
  Furnace Installation,"furnace,install,hvac",2500.00,Each,Complete installation
  ```

### Dynamic PDF Branding
All PDFs automatically include:
- Your company logo (top-left)
- Company name as header
- Tagline as subheader
- Contact info in footer

---

## 🔐 Security & Privacy

- API keys stored in `.env` (never committed)
- OAuth tokens cached in `token.pickle`
- No data sent to external servers (except OpenAI for parsing)
- Gmail drafts created locally, you approve before sending

---

## 🐛 Troubleshooting

### "Connection Refused" on Frontend
```bash
cd frontend
npm run dev
```
Ensure frontend is running on port 5002.

### "Agent Not Initialized" on Backend
```bash
python3 web_interface.py
```
Check that OpenAI API key is set in `.env`.

### Gmail "Mock Mode"
Missing `credentials.json`. See [`setup_guide.md`](./setup_guide.md) for Google Cloud setup.

### Activity Feed Empty
Activity log is in-memory. Restart backend to clear. Events are logged when quotes are created, approved, rejected, or settings updated.

---

## 📚 Documentation

- **[Setup Guide](./setup_guide.md)**: Step-by-step OpenAI & Gmail API configuration
- **[UX Improvements](./ux_improvements.md)**: Psychology principles applied to UI
- **[Implementation Plan](./implementation_plan.md)**: Technical architecture & decisions

---

## 🚧 Roadmap

- [ ] Email polling (automatic new quote detection)
- [ ] Multi-user support (teams)
- [ ] Quote templates
- [ ] Customer portal (client-facing quote acceptance)
- [ ] Analytics dashboard (conversion rates, revenue tracking)
- [ ] Mobile app

---

## 📄 License

Proprietary - Velocity Logic

---

## 🙏 Acknowledgments

Built with:
- [OpenAI GPT-4](https://openai.com) for AI parsing
- [React](https://react.dev) + [Vite](https://vite.dev) for frontend
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Recharts](https://recharts.org) for analytics
- [Lucide React](https://lucide.dev) for icons
- [FPDF](http://www.fpdf.org/) for PDF generation

---

**Made with ⚡ by Velocity Logic**
