"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";

export default function NewInterviewPage() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState("");
  const [type, setType] = useState("Behavioral");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRole, type, experienceLevel }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to the interview room
      router.push(`/interview/${data.interview.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <h1 className="auth-title">New Interview</h1>
        <p className="auth-subtitle">Configure your mock interview session.</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: error ? '1rem' : '0' }}>
          <div className="input-group">
            <label htmlFor="jobRole">Job Role</label>
            <input
              id="jobRole"
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="experienceLevel">Experience Level</label>
            <select
              id="experienceLevel"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              required
              style={{
                width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                color: "white", fontSize: "1rem"
              }}
            >
              <option value="Intern">Intern</option>
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Staff/Principal">Staff / Principal</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="type">Interview Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              style={{
                width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                color: "white", fontSize: "1rem"
              }}
            >
              <option value="Behavioral">Behavioral (STAR Method, Communication)</option>
              <option value="Technical">Technical (Problem Solving, Knowledge)</option>
              <option value="System Design">System Design (Architecture, Trade-offs)</option>
              <option value="HR / Culture Fit">HR / Culture Fit (Values, Motivation)</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }} disabled={loading}>
            <Briefcase size={20} />
            {loading ? "Starting..." : "Start Interview"}
          </button>
        </form>
      </div>
    </div>
  );
}
