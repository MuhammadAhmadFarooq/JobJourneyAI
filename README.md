# 🚀 JobJourneyAI

An AI-powered job search, resume analyzer, and interview preparation platform built with React, Node.js, Express, MongoDB/Drizzle, and Google Gemini AI.

---

## ✨ Features

- 📄 **AI Resume Parsing**: Upload or paste resume text to automatically extract skills, work experience, education, contact info, and tailored summaries using Google Gemini AI.
- 🎯 **Smart Job Matching**: Search and scrape real-time job listings matched against applicant resume profiles via Serper API.
- 🎙️ **AI Interview Preparation**: Generate customized role-specific technical, behavioral, and situational interview questions with sample answers and key points.
- 📊 **Interactive Dashboard**: Track application statuses, manage resumes, and view analytics on your career preparation journey.
- 🔐 **Authentication**: User registration and login flow powered by Express sessions and Passport.js.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Radix UI + Framer Motion
- **Routing**: Wouter
- **State & Data Fetching**: TanStack React Query + Axios

### Backend
- **Server**: Node.js + Express (TypeScript)
- **Database**: MongoDB (via Mongoose) / PostgreSQL (via Drizzle ORM)
- **AI Integration**: Google Gemini AI (`@google/generative-ai`)
- **Job Search Scraper**: Serper API + Cheerio

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Define the following configuration values in `.env`:

| Variable | Description |
|---|---|
| `PORT` | Server port (Default: `5000`) |
| `MONGODB_URI` | Connection URI for MongoDB database |
| `SESSION_SECRET` | Secret key for session encryption |
| `GEMINI_API_KEY` | Google Gemini API key ([Get API Key](https://aistudio.google.com/)) |
| `SERPER_API_KEY` | Serper API key for job search scraping ([Get API Key](https://serper.dev)) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB** instance (local or Atlas)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/MuhammadAhmadFarooq/Heka_Peka.git
cd Heka_Peka
npm install
```

### 3. Running Development Server

Start both backend server and client dev server concurrently:

```bash
npm run dev
```

The application will be accessible at: `http://localhost:5000`

---

## 📜 Available Scripts

- `npm run dev`: Starts the application in development mode using `tsx`.
- `npm run build`: Bundles the client and server for production build.
- `npm run start`: Runs the compiled production server (`dist/index.cjs`).
- `npm run check`: Runs TypeScript type checking (`tsc`).
- `npm run db:push`: Applies database schema migrations via Drizzle Kit.

---

## 📁 Project Structure

```
Heka_Peka/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI & layout components (Radix + Tailwind)
│   │   ├── contexts/       # Auth context and app providers
│   │   ├── pages/          # App pages (Dashboard, Resume, Jobs, Interview, Auth)
│   │   └── App.tsx         # Main router & provider setup
├── server/                 # Express backend server
│   ├── models/             # Mongoose data schemas
│   ├── services/           # Gemini AI & Serper job scraper integrations
│   ├── index.ts            # Express server initialization
│   └── routes.ts           # REST API endpoints
├── shared/                 # Shared TypeScript interfaces and schemas
├── .env.example            # Environment variables template
├── package.json            # Project dependencies and scripts
└── vite.config.ts          # Vite configuration
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
