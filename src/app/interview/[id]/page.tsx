"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { Mic, Square, PhoneOff } from "lucide-react";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const interviewId = resolvedParams.id;
  
  const [callStatus, setCallStatus] = useState<"inactive" | "loading" | "active">("inactive");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [transcript, setTranscript] = useState<{role: string, content: string}[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    // Fetch interview settings
    fetch(`/api/interviews/${interviewId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInterviewData(data.interview);
        }
      })
      .catch(console.error);

    // Vapi Event Listeners
    vapi.on("call-start", () => setCallStatus("active"));
    vapi.on("call-end", () => setCallStatus("inactive"));
    vapi.on("volume-level", (level: number) => setVolumeLevel(level));
    vapi.on("message", (msg: any) => {
      // Vapi sends transcript messages for both the user and assistant
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setTranscript(prev => [...prev, { role: msg.role, content: msg.transcript }]);
      }
    });
    vapi.on("error", (e: any) => {
      console.error(e);
      setCallStatus("inactive");
    });

    return () => {
      vapi.stop();
      vapi.removeAllListeners();
    };
  }, [interviewId]);

  const startInterview = async () => {
    if (!interviewData) return;
    setTranscript([]); // reset
    setCallStatus("loading");
    
    // Construct dynamic system prompt based on interview type
    let systemPrompt = `You are an expert ${interviewData.jobRole} interviewer conducting a ${interviewData.type} interview for a ${interviewData.user?.experienceLevel || "Mid-Level"} candidate.\n\n`;
    
    systemPrompt += `CRITICAL INSTRUCTIONS:\n`;
    systemPrompt += `1. Start with a brief opening: introduce yourself, state the role being interviewed for, and briefly mention what this interview will cover.\n`;
    systemPrompt += `2. Ask ONE question at a time. DO NOT ask multiple questions in a single response.\n`;
    systemPrompt += `3. Actually process the candidate's response before deciding what comes next. Follow up when an answer is vague or interesting.\n`;
    systemPrompt += `4. TIME LIMIT: You MUST ask a MAXIMUM of 3 to 4 main questions total during this entire interview.\n`;
    systemPrompt += `5. After the candidate has answered your final (3rd or 4th) question, you MUST wrap up the interview. Thank them for their time, provide a very brief 1-sentence wrap-up, and clearly state that the interview is now concluded. DO NOT ask any further questions after the wrap-up.\n\n`;

    if (interviewData.type === "Behavioral") {
      systemPrompt += `Focus on Behavioral questions. Test communication, self-awareness, and look for the STAR (Situation, Task, Action, Result) structure in their answers.`;
    } else if (interviewData.type === "Technical") {
      systemPrompt += `Focus on Technical questions. Test depth of knowledge and problem-solving approach. Ask them to explain concepts clearly.`;
    } else if (interviewData.type === "System Design") {
      systemPrompt += `Focus on System Design. Test architecture thinking, tradeoffs, and communicating complexity. Ask them to design scalable systems related to ${interviewData.jobRole}.`;
    } else {
      systemPrompt += `Focus on HR / Culture Fit. Test motivation, values, and situational judgment.`;
    }

    try {
      await vapi.start({
        name: "Mock Interviewer",
        firstMessage: `Hello! I am your AI interviewer. Are you ready to begin our ${interviewData.type} interview for the ${interviewData.jobRole} role?`,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        voice: {
          provider: "openai",
          voiceId: "alloy",
        },
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ]
        },
        metadata: {
          interviewId: interviewId, 
        }
      });
    } catch (e) {
      console.error("Failed to start Vapi call", e);
      setCallStatus("inactive");
    }
  };

  const endInterview = async () => {
    vapi.stop();
    setCallStatus("inactive");
    setIsGeneratingReport(true);
    
    try {
      // Send the transcript to our backend to generate the report
      const res = await fetch(`/api/interviews/${interviewId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      router.push(`/interview/${interviewId}/report`);
    } catch (e) {
      console.error("Failed to generate report", e);
      setIsGeneratingReport(false);
      alert("Failed to generate the feedback report. Please try again or check the console.");
      router.push("/dashboard");
    }
  };

  return (
    <div className="container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="dashboard-header" style={{ padding: "1.5rem 0", marginBottom: "0", borderBottom: "none" }}>
        <h1 className="dashboard-title">Interview Session</h1>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="btn-danger"
          style={{ backgroundColor: "transparent", border: "1px solid var(--border)", color: "#cbd5e1" }}
        >
          Exit Room
        </button>
      </header>

      <div className="interview-room">
        <div className={`visualizer-container ${callStatus === "active" ? "active" : ""}`}>
          <div className="visualizer-pulse" style={{ 
            animationDuration: volumeLevel > 0.1 ? "0.5s" : "1.5s",
            transform: `scale(${1 + volumeLevel})`,
            opacity: volumeLevel > 0.1 ? 0.8 : 0
          }}></div>
          
          <Mic size={64} color={callStatus === "active" ? "var(--primary)" : "#64748b"} />
        </div>

        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            {callStatus === "inactive" ? "Ready to begin?" : callStatus === "loading" ? "Connecting..." : "Interview in progress"}
          </h2>
          <p style={{ color: "#94a3b8" }}>
            {callStatus === "inactive" 
              ? "Ensure your microphone is connected in a quiet environment." 
              : "Speak clearly. The AI will evaluate your answers."}
          </p>
        </div>

        <div className="controls">
          {callStatus === "inactive" && !isGeneratingReport ? (
            <button onClick={startInterview} className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.125rem", borderRadius: "999px" }}>
              <Mic size={24} />
              Start Interview
            </button>
          ) : isGeneratingReport ? (
            <div style={{ color: "#94a3b8", fontSize: "1.125rem" }}>
              Analyzing conversation and generating feedback report...
            </div>
          ) : (
            <button onClick={endInterview} className="btn-danger" style={{ padding: "1rem 2.5rem", fontSize: "1.125rem", borderRadius: "999px" }}>
              <Square size={24} fill="currentColor" />
              End Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
