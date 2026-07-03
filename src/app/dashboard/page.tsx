import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Video, Clock } from "lucide-react";

export default async function DashboardPage() {
  const userId = await getAuthUserId();
  
  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      interviews: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container">
      <div className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {user.name || "User"}</h1>
            <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Track your mock interviews and improve your skills.</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <a href="/api/auth/logout" className="btn-danger" style={{ textDecoration: "none", backgroundColor: "transparent", border: "1px solid var(--border)", color: "#cbd5e1" }}>
              Logout
            </a>
            <Link href="/interview/new" className="btn-primary" style={{ textDecoration: "none" }}>
              <Plus size={20} />
              New Interview
            </Link>
          </div>
        </header>

        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Recent Interviews</h2>
          
          {user.interviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "1rem", border: "1px dashed var(--border)" }}>
              <Video size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>No interviews yet</h3>
              <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>Start your first mock interview to get AI feedback.</p>
              <Link href="/interview/new" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
                Start Interview
              </Link>
            </div>
          ) : (
            <div className="interviews-grid">
              {user.interviews.map((interview) => (
                <div key={interview.id} className="interview-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>{interview.jobRole}</h3>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "9999px", 
                      backgroundColor: interview.status === "COMPLETED" ? "rgba(34, 197, 94, 0.2)" : "rgba(234, 179, 8, 0.2)",
                      color: interview.status === "COMPLETED" ? "#4ade80" : "#facc15"
                    }}>
                      {interview.status}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                    <Clock size={16} />
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </div>
                  
                  {interview.score !== null && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                        <span>Overall Score</span>
                        <span style={{ fontWeight: "600", color: "white" }}>{interview.score}/100</span>
                      </div>
                      <div style={{ height: "6px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${interview.score}%`, backgroundColor: "var(--primary)", borderRadius: "3px" }}></div>
                      </div>
                    </div>
                  )}

                  <Link href={interview.status === "COMPLETED" ? `/interview/${interview.id}/report` : `/interview/${interview.id}`} style={{ 
                    display: "block", 
                    width: "100%", 
                    textAlign: "center", 
                    padding: "0.5rem", 
                    backgroundColor: "rgba(59, 130, 246, 0.1)", 
                    color: "var(--primary)", 
                    borderRadius: "0.5rem", 
                    textDecoration: "none",
                    fontWeight: "500",
                    transition: "background-color 0.2s"
                  }}>
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
