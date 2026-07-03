import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, FileText } from "lucide-react";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  
  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;
  const interview = await prisma.interview.findUnique({
    where: { id },
  });

  if (!interview || interview.userId !== userId) {
    redirect("/dashboard");
  }

  // If the interview is still in progress, wait for the webhook/generation to finish
  if (interview.status !== "COMPLETED" || !interview.feedback) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Generating Feedback Report...</h2>
          <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>Our AI is analyzing your interview transcript. Please wait a moment and refresh the page.</p>
          <a href={`/interview/${id}/report`} className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>Refresh</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content" style={{ maxWidth: "800px" }}>
        <header className="dashboard-header" style={{ marginBottom: "2rem" }}>
          <div>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", textDecoration: "none", marginBottom: "1rem" }}>
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <h1 className="dashboard-title">Interview Feedback Report</h1>
            <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>{interview.type} Interview for {interview.jobRole}</p>
          </div>
        </header>

        <div style={{ display: "grid", gap: "2rem" }}>
          <div className="auth-card" style={{ width: "100%", padding: "2rem", margin: 0, textAlign: "center" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Overall Score</h2>
            <div style={{ fontSize: "4rem", fontWeight: "700", color: "var(--primary)" }}>
              {interview.score}<span style={{ fontSize: "1.5rem", color: "#64748b" }}>/100</span>
            </div>
          </div>

          <div className="auth-card" style={{ width: "100%", padding: "2rem", margin: 0 }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={24} color="var(--primary)" />
              Detailed Analysis
            </h2>
            
            <div className="markdown-content" style={{ lineHeight: "1.6", color: "#cbd5e1" }}>
              {/* Simple rendering for the generated markdown content */}
              {interview.feedback.split('\n').map((line, i) => {
                if (line.startsWith('### ')) return <h3 key={i} style={{ marginTop: "2rem", marginBottom: "1rem", color: "white" }}>{line.replace('### ', '')}</h3>;
                if (line.startsWith('#### ')) return <h4 key={i} style={{ marginTop: "1.5rem", marginBottom: "0.75rem", color: "white" }}>{line.replace('#### ', '')}</h4>;
                if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: "1.5rem", marginBottom: "0.5rem" }}>{line.replace('- ', '')}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} style={{ marginBottom: "1rem" }}>{line}</p>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
