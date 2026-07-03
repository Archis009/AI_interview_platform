import Link from "next/link";
import { Mic, CheckCircle, BrainCircuit } from "lucide-react";

export default function Home() {
  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ padding: "1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", fontSize: "1.25rem" }}>
          <BrainCircuit color="var(--primary)" />
          <span>AI Mock Interview</span>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/login" style={{ color: "#cbd5e1", textDecoration: "none", padding: "0.5rem 1rem" }}>
            Login
          </Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", padding: "0.5rem 1.25rem" }}>
            Sign Up
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4rem 0" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "800", marginBottom: "1.5rem", lineHeight: "1.1" }}>
          Master Your Next <br />
          <span style={{ color: "var(--primary)" }}>Interview</span>
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#94a3b8", maxWidth: "600px", marginBottom: "3rem" }}>
          Practice with an AI interviewer that listens, adapts, and evaluates your answers in real-time using advanced voice AI.
        </p>

        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/signup" className="btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.125rem", textDecoration: "none" }}>
            Get Started Free
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginTop: "5rem", textAlign: "left", width: "100%", maxWidth: "900px" }}>
          <div style={{ background: "var(--surface)", padding: "2rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
            <Mic size={32} color="var(--primary)" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Real-time Voice</h3>
            <p style={{ color: "#94a3b8" }}>Ultra-low latency voice conversation powered by Vapi.ai for a natural flow.</p>
          </div>
          <div style={{ background: "var(--surface)", padding: "2rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
            <BrainCircuit size={32} color="var(--primary)" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Adaptive AI</h3>
            <p style={{ color: "#94a3b8" }}>LangGraph backend evaluates your answers and dynamically asks follow-up questions.</p>
          </div>
          <div style={{ background: "var(--surface)", padding: "2rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
            <CheckCircle size={32} color="var(--primary)" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Instant Feedback</h3>
            <p style={{ color: "#94a3b8" }}>Get evaluated on the spot with detailed scoring and constructive feedback.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
