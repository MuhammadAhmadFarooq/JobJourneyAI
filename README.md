# 🚀 JobJourneyAI

An AI-powered, real-time job discovery platform, resume intelligence engine, and automated interview preparation assistant. Built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, and **Google Gemini AI**.

---

## 🌟 Key Platform Capabilities

### 🌐 High-Volume Multi-Platform Job Aggregation Engine
JobJourneyAI pools and aggregates active job opportunities from multiple tier-1 platforms and job APIs in parallel:
- **LinkedIn (Fresh Weekly Filter `tbs: "qdr:w"`)**: Queries Google Serper search index constrained exclusively to listings posted or updated within the last 7 days.
- **Indeed & Direct Company Portals**: Captures active listings across major platforms.
- **Remotive, Arbeitnow, & Jobicy API Pooling**: Fetches verified active remote and global engineering positions with working direct apply links.

### 🛡️ Reverse Availability & Anti-Expired Job Protection
Unlike standard job aggregators that display expired or closed links, JobJourneyAI implements a strict **Reverse Verification Pipeline**:
- **LinkedIn Guest API Availability Check**: Verifies live Guest API endpoints (`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/<jobId>`) for HTTP 404/410/403/999 status codes and closed tags (`topcard__flavor--closed`).
- **Mandatory Apply Button Verification**: Ensures a job posting contains an active Apply option (`topcard__btn--apply`, `easy apply`, or offsite apply link). If LinkedIn removes the apply button, the listing is automatically flagged as closed and excluded.
- **Strict 14-Day Age Cutoff**: Parses relative date strings (`"1 month ago"`, `"3 weeks ago"`, `"2 weeks ago"`) and live HTML date tags. Any job posted 14+ days ago is automatically excluded from your feed.
- **Indeed & API Preservation**: Bypasses network blocks on Indeed and API-driven job boards to guarantee 100% of open Indeed listings remain visible.

### 📊 Multi-Factor Profile Strength Matrix (100-Point Scoring)
Evaluates applicant profile completeness and competitiveness using a transparent 8-factor weighted matrix:
| Category | Max Score | Criteria |
| :--- | :--- | :--- |
| 🛠️ **Technical Skills** | **20 pts** | 15+ verified skills = 20 pts (10+ = 15 pts, 5+ = 10 pts) |
| 💼 **Work Experience** | **20 pts** | 4+ documented roles = 20 pts (3 roles = 16 pts, 2 roles = 12 pts) |
| 📇 **Contact & Socials** | **15 pts** | Name, Email, Location, Phone & LinkedIn/GitHub/Portfolio URLs |
| 📄 **Resume File** | **10 pts** | Valid parsed PDF/DOCX resume file uploaded |
| 🎓 **Education & Degrees** | **10 pts** | 2+ degrees/certifications = 10 pts (1 degree = 7 pts) |
| 📝 **Professional Summary** | **10 pts** | Detailed executive bio (>150 characters) |
| 🎯 **Job Preferences** | **10 pts** | Configured target roles, preferred locations, and remote preferences |
| 🚀 **Projects & Portfolio** | **5 pts** | 3+ built projects with technology tags |

### 🎛️ Precision Job Filtering & Search
- **Match Score Thresholds**: Filter jobs by compatibility (**80%+ Match**, **60%+ Match**, **All Scores**).
- **Location Filter (Remote Only)**: Inspects location, job type, title, and description for `"remote"`, `"anywhere"`, `"work from home"`, and `"wfh"`.
- **Normalized Job Types**: Standardizes job types (`Full-time`, `Part-time`, `Contract`, `Internship`, `Remote`) across different job board formats.
- **Instant Reset**: One-click filter reset control.

### 📄 Resume Intelligence & AI Interview Preparation
- **PDF & DOCX Parsing**: Extracts skills, experience timeline, education, and contact details via `pdfjs-dist` and Google Gemini AI.
- **Tailored Interview Prep**: Generates role-specific technical, behavioral, and situational questions, hints, sample answers, and company insights.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS + Tailwind CSS + Radix UI + Framer Motion
- **Routing**: Wouter
- **Data Visualizations**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js + Express (TypeScript)
- **Database**: MongoDB (via Mongoose)
- **AI Models**: Google Gemini AI (`@google/generative-ai`)
- **Scraper & Fetchers**: Axios + Cheerio + Serper API
- **Document Parsing**: `pdfjs-dist` + `mammoth`

---

## ⚙️ Environment Variables

Create a `.env` file in the project root directory:

```bash
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jobjourneyai
SESSION_SECRET=your_super_secret_session_key
GEMINI_API_KEY=your_google_gemini_api_key
SERPER_API_KEY=your_serper_dev_api_key
```

| Variable | Description |
|---|---|
| `PORT` | Web server port (Default: `5000`) |
| `MONGODB_URI` | Connection URI for MongoDB database |
| `SESSION_SECRET` | Secret key for Express session encryption |
| `GEMINI_API_KEY` | Google Gemini API key ([Get API Key](https://aistudio.google.com/)) |
| `SERPER_API_KEY` | Serper API key for Google job search indexing ([Get API Key](https://serper.dev)) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Local instance or MongoDB Atlas cluster

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/MuhammadAhmadFarooq/JobJourneyAI.git
cd JobJourneyAI
npm install
```

### 3. Running Development Server

Start both Express backend server and React Vite dev server concurrently:

```bash
npm run dev
```

Open your browser at `http://localhost:5000`.

---

## 📜 Available Scripts

- `npm run dev`: Starts Express server and Vite frontend concurrently using `tsx watch`.
- `npm run build`: Compiles TypeScript and builds production asset bundles.
- `npm run start`: Starts the compiled production server (`dist/index.cjs`).
- `npm run check`: Performs TypeScript compilation type-checking (`npx tsc --noEmit`).

---

## 📁 Project Structure

```
JobJourneyAI/
├── client/                 # React 19 Frontend Application
│   ├── src/
│   │   ├── components/     # Radix UI & Tailwind components
│   │   ├── contexts/       # Auth context and state providers
│   │   ├── pages/          # Dashboard, Jobs, Resume, Interview, Auth
│   │   └── App.tsx         # Router & root layout
├── server/                 # Express TypeScript Backend
│   ├── models/             # Mongoose schemas (UserProfile, Job, SavedJobs)
│   ├── routes/             # REST endpoints (auth, profile, jobs, interview)
│   ├── services/           # Gemini AI, Serper scraper & availability checker
│   ├── db.ts               # Resilient MongoDB connection manager
│   └── index.ts            # Server entry point
├── shared/                 # Shared TypeScript types and schemas
├── .env.example            # Environment variables template
├── package.json            # Dependencies & scripts
└── vite.config.ts          # Vite bundler configuration
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
