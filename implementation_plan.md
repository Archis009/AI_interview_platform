# AI Mock Interview Platform - Architecture & Implementation Plan

This document outlines the proposed approach, tech stack, AI services, and user flow for building the AI Mock Interview Platform as per the assignment brief.

## Proposed Tech Stack

Based on the requirements (React, Node.js/Next.js, PostgreSQL, Simple JWT), here is the most efficient and reliable stack:

*   **Framework:** **Next.js (App Router)**. This is the optimal choice as it allows us to build the React frontend and the Node.js backend (API routes) in a single unified repository, minimizing setup complexity and ensuring fast execution.
*   **Database:** **PostgreSQL** managed via **Prisma ORM**. Prisma provides excellent type safety and makes database interactions very clean.
*   **Authentication:** **Custom JWT** using `jsonwebtoken` and `bcrypt`. We will implement custom Next.js middleware to protect routes and verify the JWT, strictly adhering to the "No OAuth" rule.
*   **Styling:** **Vanilla CSS with CSS Modules** (or Tailwind CSS if you explicitly prefer it). We will focus on a premium, dynamic UI with glassmorphism and smooth micro-animations to meet the high design bar.

## Voice AI Service Recommendation

The brief strictly requires a **managed voice AI service** (no building custom WebRTC/Whisper pipelines).

**Recommendation: Vapi.ai** (Alternative: Retell AI)
*   **Why Vapi.ai?** It handles Voice Activity Detection (VAD), interruptions (if the user talks over the AI), Speech-to-Text (STT), and Text-to-Speech (TTS) out of the box with ultra-low latency.
*   **Custom LLM Integration:** Most importantly, Vapi allows us to bypass its internal LLM and route the conversation to our own custom backend URL. This is critical because we need to implement a complex conversation engine (LangGraph) rather than a simple chatbot.

## The Conversation Engine (LangGraph)

To meet the "Interaction Requirement" (adaptive branching, follow-ups, probing weak answers), we will implement a **State Graph** using `@langchain/langgraph` (Node.js version) on our Next.js backend.

*   **State:** The graph will hold the session state (transcript, current question, interview type, user profile, evaluation scores).
*   **Nodes:**
    1.  `Question_Generator`: Picks or generates the next question based on the interview type and user profile.
    2.  `Answer_Evaluator`: Evaluates the user's response. Did they answer fully? Was it vague?
    3.  `Router`: Decides whether to route to a `Follow_Up_Generator` (to probe deeper) or back to `Question_Generator` (to move on).
    4.  `Feedback_Generator`: Runs at the end to compile the final report based on the entire transcript.

## User Flow

1.  **Onboarding:**
    *   User signs up (Email/Password) -> JWT is issued and stored in HTTP-only cookies.
    *   User fills out a brief profile (Name, Role, Experience Level).
2.  **Dashboard:**
    *   User views past sessions and selects a new Interview Type (Behavioral, Technical, System Design, HR).
3.  **The Interview (Core Loop):**
    *   User lands in the Interview UI. The UI will be visually striking, featuring a dynamic audio visualizer (e.g., a pulsing orb) to indicate when the AI is listening or speaking.
    *   **Frontend** initiates a Vapi.ai web call.
    *   **AI Starts:** Vapi triggers our Next.js backend. Our LangGraph generates a personalized greeting and the first question.
    *   **Dynamic Loop:**
        *   Candidate speaks -> Vapi transcribes -> Sends text to our Next.js backend.
        *   LangGraph evaluates the text -> Updates state -> Generates response (follow-up or new question).
        *   Backend returns text to Vapi -> Vapi converts to speech and plays it to the user.
4.  **Completion & Feedback:**
    *   User clicks "End Session" (or time expires).
    *   Backend triggers the `Feedback_Generator` node in LangGraph, analyzing the entire transcript.
    *   A detailed feedback report is saved to PostgreSQL and presented to the user on the dashboard.

## Open Questions & User Review Required

> [!IMPORTANT]
> Please review the following design decisions before we begin execution:

1.  **Voice Service Choice:** Are you comfortable proceeding with **Vapi.ai**? It is highly reliable for this exact use case and provides a free tier for development.
2.  **Styling Framework:** My default is to use Vanilla CSS to craft a highly polished, custom UI. However, if you prefer **Tailwind CSS** for faster styling, please let me know!
3.  **LLM Provider:** We will need an LLM to power the LangGraph reasoning. OpenAI (GPT-4o) is highly recommended for its reasoning capabilities. Do you have an OpenAI API key we can use for development?

## Verification Plan
1.  Setup Next.js, Prisma, and Postgres.
2.  Implement JWT Auth and verify user registration/login flows.
3.  Build a prototype LangGraph locally to test the adaptive questioning logic in text.
4.  Integrate Vapi.ai SDK and connect it to the Next.js API route to test end-to-end voice latency and graph logic.
5.  Build the dynamic frontend UI and connect it to the backend.
