<div align="center">

```
  ██████╗  ██████╗ ██████╗       ██╗ ██████╗ ██╗   ██╗██████╗ ███╗   ██╗███████╗██╗   ██╗ █████╗ ██╗
  ██╔═══██╗██╔═══██╗██╔══██╗      ██║██╔═══██╗██║   ██║██╔══██╗████╗  ██║██╔════╝╚██╗ ██╔╝██╔══██╗██║
  ██║   ██║██║   ██║██████╔╝      ██║██║   ██║██║   ██║██████╔╝██╔██╗ ██║█████╗   ╚████╔╝ ███████║██║
  ██║   ██║██║   ██║██╔══██╗ ██   ██║██║   ██║██║   ██║██╔══██╗██║╚██╗██║██╔══╝    ╚██╔╝  ██╔══██║██║
  ╚██████╔╝╚██████╔╝██████╔╝ ╚█████╔╝╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║███████╗   ██║   ██║  ██║██║
   ╚═════╝  ╚═════╝ ╚═════╝   ╚════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝
```

### ⚡ Next-Generation AI Career Navigation & Job Matchmaking Ecosystem ⚡

[![Production Live](https://img.shields.io/badge/LIVE%20DEMO-jobjourneyai.tech-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://jobjourneyai.tech)
[![React 19](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Groq AI Engine](https://img.shields.io/badge/Groq%20LPU-Ultra--Fast%20LLM-F05A28?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Live Production Platform:</b> <a href="https://jobjourneyai.tech">https://jobjourneyai.tech</a>
</p>

---

</div>

## 🌌 Overview

**JobJourneyAI** is a futuristic, full-stack career platform engineered to eliminate friction from the modern job search. Powered by high-speed **Groq LPU AI inference** (`openai/gpt-oss-120b`), real-time job availability verification, and intelligent document generation, JobJourneyAI acts as your 24/7 personal career co-pilot.

Whether parsing complex resumes, neutralizing expired job listings, tailoring application variants for ATS filters, drafting high-converting outreach emails, or generating interactive interview coaching kits with integrated **YouTube video masterclasses**, JobJourneyAI delivers state-of-the-art results in seconds.

---

## ⚡ Key Capabilities & Feature Matrix

```
                      ┌────────────────────────────────────────┐
                      │        JobJourneyAI Core Engine        │
                      └───────────────────┬────────────────────┘
                                          │
        ┌───────────────────┬─────────────┴───────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐   ┌───────────────┐
│  Live Job Feed│   │  ATS Resume   │     │  AI Outreach  │   │  AI Interview │
│  & Shield API │   │ Tailor Studio │     │  & Cover Letter│   │ Coach & Videos│
└───────────────┘   └───────────────┘     └───────────────┘   └───────────────┘
```

### 🛡️ 1. Anti-Expired Job Shield & Multi-Platform Aggregation
Never waste time applying to dead or closed postings again.
- **LinkedIn Guest API Verification**: Inspects live status codes (`404/410/403/999`) and DOM elements (`topcard__flavor--closed`) in real-time.
- **Mandatory Apply Button Check**: Validates that active apply buttons (`topcard__btn--apply`, `easy apply`) are present before displaying a job.
- **Strict 14-Day Age Cutoff**: Eliminates stale listings posted weeks ago.
- **Multi-Source Aggregation**: Integrates LinkedIn (Google Serper weekly index `tbs: "qdr:w"`), Indeed, Remotive, Arbeitnow, and Jobicy APIs.

### 📄 2. Master Resume Intelligence & Skill Competency Matrix
- **PDF & TXT Parsing**: High-fidelity text extraction via `pdfjs-dist` coupled with resilient AI JSON restructuring.
- **Skill Competency Matrix**: Automatically breaks down candidate skills with proficiency ratings.
- **Full History Extraction**: Surfaces work experience timelines, education degrees, verified certifications, portfolio projects, and AI-suggested target roles.
- **100-Point Profile Strength Evaluator**: Real-time 8-factor completeness metric to maximize search matching.

### 🎯 3. AI Resume Tailor (Job-Specific Variant Generator)
- **ATS Alignment Scoring**: Calculates baseline compatibility vs. tailored match score (e.g. `62% ➔ 94%`).
- **Targeted Bullet-Point Rewriting**: Re-engineers role accomplishments and impact metrics around target job keywords.
- **Keyword Match Breakdown**: Displays verified checklist of matched ATS keywords.
- **1-Click Export**: Download tailored variants instantly as `.txt` files.

### ✉️ 4. AI Cover Letter & Cold Outreach Studio
Generate high-converting personalized application documents:
- **3 Document Modes**:
  - 📄 *Full Cover Letter* (Formal, structured, and recruiter-ready)
  - ✉️ *Recruiter Cold Email* (Punchy, metric-driven, and high-converting)
  - 💬 *LinkedIn Connection Note* (Direct 300-character networking message)
- **4 Selectable Tones**: *Professional*, *Enthusiastic*, *Executive*, *Direct*.
- **Pre-Fill Integration**: 1-click auto-fill directly from your saved jobs drawer.

### 🎙️ 5. Role-Specific AI Interview Prep Kit & YouTube Tutorial Coach
- **Company & Role Intelligence**: AI-researched company culture, interview stages, responsibilities, and compensation benchmarks.
- **Key Question Modules & Frameworks**: Situational, behavioral, and technical questions complete with *"Why This Is Asked"* breakdowns and ideal answer frameworks.
- **📺 Integrated YouTube Tutorial Search**: Dynamically searches and matches relevant YouTube technical video guides and tutorials for every question module.
- **2-Week Structured Study Timeline**: Week 1 Fundamentals, Week 2 Applied Practice, and a dedicated Final 48-Hour Checklist.

### 🌐 6. Production SEO Suite & Minimalist Mobile Experience
- **Full SEO Engine**: `react-helmet-async` dynamic metadata, OpenGraph, Twitter cards, and Schema.org `WebApplication` JSON-LD structured data.
- **Crawler Optimization**: `robots.txt` and auto-generated XML `sitemap.xml` mapped to [`https://jobjourneyai.tech`](https://jobjourneyai.tech).
- **Mobile-Responsive SaaS UI**: Clean, glassmorphic card borders, mobile Sheet navigation, and touch-optimized action buttons.

---

## 🛠️ Architecture & Tech Stack

### Client Layer
| Technology | Description |
|---|---|
| **React 19 + Vite** | Ultra-fast client build and reactive UI engine |
| **Tailwind CSS + Radix UI** | Modern SaaS design system with light/dark theme toggle |
| **Wouter** | Lightweight client-side routing |
| **Framer Motion** | Smooth micro-animations and transition states |
| **react-helmet-async** | Dynamic per-route SEO meta tag injector |
| **pdfjs-dist** | Client-side binary PDF text parsing worker |

### Server & Database Layer
| Technology | Description |
|---|---|
| **Node.js + Express** | TypeScript REST backend architecture |
| **MongoDB Atlas + Mongoose** | Persistent storage for UserProfiles, saved jobs, and cache |
| **Groq AI LPU Engine** | Primary high-speed inference (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`) |
| **Google Gemini AI** | High-capacity fallback provider |
| **Cheerio + Axios** | Reverse-verification live link status checking |
| **Serper API** | Google Search job indexing service |

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root directory:

```env
# Server Port & Session Encryption
PORT=5000
SESSION_SECRET=your_super_secret_session_key_here

# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jobjourneyai?retryWrites=true&w=majority

# Groq AI Primary Inference (Required)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Google Serper Job Indexing (Required for live LinkedIn/Web jobs)
SERPER_API_KEY=your_serper_dev_api_key_here

# Google Gemini AI (Optional Fallback)
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/MuhammadAhmadFarooq/JobJourneyAI.git
cd JobJourneyAI

# Install project dependencies
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot concurrently on **`http://localhost:5000`** with live hot-reloading for both backend and frontend.

### 4. Build for Production
```bash
# Verify TypeScript types
npm run check

# Build client and server bundles
npm run build

# Start production server
npm start
```

---

## 🧭 REST API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate user session |
| `POST` | `/api/auth/logout` | Terminate session |
| `GET` | `/api/profile` | Retrieve active candidate profile and stats |
| `PUT` | `/api/profile` | Update profile fields and resume data |
| `POST` | `/api/resumes/parse` | AI parsing of raw resume text |
| `POST` | `/api/profile/tailor-resume` | Generate ATS-optimized tailored resume variant |
| `POST` | `/api/profile/cover-letter` | Generate AI cover letter / cold email / LinkedIn note |
| `GET` | `/api/jobs/discover` | Query live verified job feed |
| `POST` | `/api/jobs/save` | Save target job opportunity |
| `POST` | `/api/interview/generate` | Generate complete interview prep kit & YouTube video links |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Engineered with precision for the modern global job seeker • <a href="https://jobjourneyai.tech">JobJourneyAI.tech</a></sub>
</div>
