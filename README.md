# 🎙️ AI Mock Interview Platform

An intelligent mock interview platform powered by **Next.js**, **Vapi AI** (voice), and **OpenAI GPT-4o-mini**. Practice realistic voice-based interviews, receive AI-generated feedback reports, and track your progress over time.

---

## ✨ Features

- **Voice-Based AI Interviews** — Real-time conversational interviews powered by Vapi AI with natural speech recognition and response.
- **Multiple Interview Types** — Choose from Behavioral, Technical, System Design, or Cultural Fit interviews.
- **Dynamic AI Persona** — The interviewer adapts its questions and tone based on the selected interview type and job role.
- **AI Feedback Reports** — After each interview, GPT-4o-mini analyzes your transcript and generates a detailed report with scores, strengths, and areas for improvement.
- **User Authentication** — Secure signup/login with JWT-based authentication and bcrypt password hashing.
- **Interview Dashboard** — View all past interviews, scores, and statuses at a glance.
- **LangChain Integration** — Uses LangChain and LangGraph for structured AI orchestration.

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Frontend     | Next.js 16, React 19, TypeScript    |
| Voice AI     | Vapi AI                             |
| LLM          | OpenAI GPT-4o-mini (via LangChain)  |
| Database     | SQLite (via Prisma ORM)             |
| Auth         | JWT + bcryptjs                      |
| Styling      | Vanilla CSS (dark theme)            |

---

## 📁 Project Structure

```
mock_interview/
├── prisma/
│   └── schema.prisma          # Database schema (User, Interview models)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── signup/    # POST /api/auth/signup
│   │   │   │   ├── login/     # POST /api/auth/login
│   │   │   │   └── logout/    # GET  /api/auth/logout
│   │   │   └── interviews/
│   │   │       ├── route.ts   # POST (create) & GET (list) interviews
│   │   │       └── [id]/
│   │   │           ├── route.ts       # GET single interview
│   │   │           └── feedback/
│   │   │               └── route.ts   # POST — AI feedback generation
│   │   ├── dashboard/         # User dashboard with interview history
│   │   ├── interview/
│   │   │   ├── new/           # Interview setup (type, role selection)
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Live interview room (Vapi)
│   │   │       └── report/    # AI-generated feedback report
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   └── page.tsx           # Landing page
│   └── lib/
│       ├── auth.ts            # JWT helpers
│       ├── prisma.ts          # Prisma client singleton
│       └── langgraph.ts       # LangGraph workflow
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- An **OpenAI API key** ([platform.openai.com](https://platform.openai.com))
- A **Vapi AI** account with public + private keys ([vapi.ai](https://vapi.ai))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd mock_interview
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your-vapi-public-key"
VAPI_PRIVATE_KEY="your-vapi-private-key"
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="your-secret-key"
DATABASE_URL="file:./dev.db"
```

### 3. Set Up the Database

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Usage

1. **Sign up** with your name, email, and password.
2. Click **+ New Interview** from the dashboard.
3. Select a **job role**, **interview type**, and **experience level**.
4. Click **Start Interview** — speak naturally with the AI interviewer.
5. After 3–4 questions, the AI wraps up. Click **End Interview**.
6. View your **AI Feedback Report** with scores and actionable advice.

---

## 📄 License

This project is for educational/assignment purposes.
