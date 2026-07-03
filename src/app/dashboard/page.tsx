import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AudioWaveform } from "lucide-react";
import { DashboardCharts } from "./components/DashboardCharts";

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

  const interviews = user.interviews;
  const totalInterviews = interviews.length;
  
  // Calculate completion and scores
  const completedInterviews = interviews.filter(i => i.status === "COMPLETED");
  const completionRate = totalInterviews > 0 
    ? Math.round((completedInterviews.length / totalInterviews) * 100) 
    : 0;

  const validScores = completedInterviews.filter(i => i.score !== null).map(i => i.score as number);
  const averageScore = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  // Recent change (difference between last two completed interviews)
  let recentChange = 0;
  if (validScores.length >= 2) {
    recentChange = validScores[0] - validScores[1]; // validScores[0] is the most recent because of desc order
  } else if (validScores.length === 1) {
    recentChange = validScores[0];
  }

  const recentChangeText = recentChange > 0 ? `+${recentChange}` : `${recentChange}`;

  // Find last incomplete or most recent
  const latestInterview = interviews[0];
  const continueInterview = interviews.find(i => i.status !== "COMPLETED") || latestInterview;

  // Prepare score history for the chart (reverse so chronological)
  const scoreHistory = completedInterviews
    .filter(i => i.score !== null)
    .reverse()
    .map((i, index) => ({
      name: `#${index + 1}`,
      score: i.score as number
    }));

  return (
    <div className="container">
      <div className="main-content">
        
        {/* Top Navigation */}
        <header className="dashboard-top-nav">
          <div className="brand">
            <AudioWaveform size={24} className="brand-icon" />
            AI Interviewer
          </div>
          <div className="user-nav">
            <div className="user-avatar">
              {user.name ? user.name.substring(0, 2).toUpperCase() : "US"}
            </div>
            <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
              {user.name || "User"}
            </span>
            <a href="/api/auth/logout" className="btn-outline">
              Sign out
            </a>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div>
            <h1 className="welcome-title">Welcome back, {user.name ? user.name.split(' ')[0] : "Demo"}</h1>
            <p className="welcome-subtitle">Ready to sharpen up? Your interviewer adapts to every answer you give.</p>
          </div>
          <Link href="/interview/new" className="btn-glow">
            Start a mock interview
          </Link>
        </section>

        {/* Continue Card */}
        {continueInterview && (
          <div className="continue-card">
            <div>
              <h3 className="continue-title">Continue where you left off</h3>
              <p className="continue-subtitle">{continueInterview.jobRole} • {continueInterview.status === "COMPLETED" ? "Finished" : "In Progress"}</p>
            </div>
            <Link 
              href={continueInterview.status === "COMPLETED" ? `/interview/${continueInterview.id}/report` : `/interview/${continueInterview.id}`} 
              className="btn-glow" 
              style={{ padding: "0.6rem 1.5rem" }}
            >
              {continueInterview.status === "COMPLETED" ? "View Report" : "Resume"}
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">OVERALL SCORE</div>
            <div className="metric-value">{averageScore || "--"}</div>
            <div className="metric-sub">{averageScore > 70 ? "Hire" : (averageScore > 0 ? "Keep practicing" : "No scores yet")}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">INTERVIEWS</div>
            <div className="metric-value">{completedInterviews.length}</div>
            <div className="metric-sub">{totalInterviews} created</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">COMPLETION</div>
            <div className="metric-value">{completionRate}%</div>
            <div className="metric-sub">finished</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">RECENT CHANGE</div>
            <div className="metric-value">{recentChangeText}</div>
            <div className="metric-sub">vs. previous</div>
          </div>
        </div>

        {/* Charts */}
        {scoreHistory.length > 0 && (
          <DashboardCharts scoreHistory={scoreHistory} />
        )}

      </div>
    </div>
  );
}
