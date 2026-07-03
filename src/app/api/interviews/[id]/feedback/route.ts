import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { transcript } = await request.json();

    const interview = await prisma.interview.findUnique({ where: { id }, include: { user: true } });
    if (!interview || interview.userId !== userId) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Format the transcript for the LLM
    const transcriptText = transcript.map((msg: { role: string; content: string }) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n");

    if (!transcriptText.trim()) {
      await prisma.interview.update({
        where: { id },
        data: {
          status: "COMPLETED",
          score: 0,
          feedback: "The interview ended before any meaningful conversation took place. Please try again and ensure your microphone is working.",
          transcript: "[]"
        }
      });
      return NextResponse.json({ success: true });
    }

    let content = "{}";
    try {
      const sysMsgContent = `You are an expert technical recruiter reviewing a ${interview.type} interview transcript for a ${interview.jobRole} role. The candidate is a ${interview.user?.experienceLevel || "Mid-Level"} professional.

Analyze the following interview transcript and provide a detailed feedback report. Provide honest, constructive feedback.

IMPORTANT: Your response must be ONLY valid JSON matching this exact structure:
{"score": 85, "strengths": ["strength 1", "strength 2", "strength 3"], "weaknesses": ["weakness 1", "weakness 2"], "detailedFeedback": "A comprehensive paragraph summarizing their performance, communication style, and specific advice for next time."}`;

      const humanMsgContent = `Here is the interview transcript:\n\n${transcriptText}`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" },
          temperature: 0.2,
          messages: [
            { role: "system", content: sysMsgContent },
            { role: "user", content: humanMsgContent }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      content = data.choices[0].message.content;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      console.error("[FEEDBACK] OpenAI failed:", e);
      
      // Save the transcript anyway so it's not stuck in IN_PROGRESS
      await prisma.interview.update({
        where: { id },
        data: {
          status: "COMPLETED",
          score: 0,
          feedback: `### ⚠️ API Error\n\nYour interview transcript was saved successfully, but we could not generate the AI feedback report due to an API error.\n\n**Error Details:**\n\`\`\`\n${errorMessage}\n\`\`\`\n\nPlease check your OpenAI API key or try again later.`,
          transcript: JSON.stringify(transcript),
        },
      });

      return NextResponse.json({ success: true, warning: "API failed" });
    }

    console.log("[FEEDBACK] OpenAI response received, parsing...");

    let feedbackData;
    try {
      feedbackData = JSON.parse(content);
    } catch (e) {
      console.error("[FEEDBACK] Failed to parse JSON:", content);
      feedbackData = {
        score: 50,
        strengths: ["Could not determine strengths due to an analysis error."],
        weaknesses: ["Could not determine weaknesses due to an analysis error."],
        detailedFeedback: "An error occurred while generating the detailed feedback."
      };
    }

    const strengths = Array.isArray(feedbackData.strengths) ? feedbackData.strengths : ["N/A"];
    const weaknesses = Array.isArray(feedbackData.weaknesses) ? feedbackData.weaknesses : ["N/A"];

    const feedbackMarkdown = `
### Overall Score: ${feedbackData.score || 0}/100

#### Strengths
${strengths.map((s: string) => `- ${s}`).join("\n")}

#### Areas for Improvement
${weaknesses.map((w: string) => `- ${w}`).join("\n")}

#### Detailed Feedback
${feedbackData.detailedFeedback || "No detailed feedback provided."}
    `.trim();

    await prisma.interview.update({
      where: { id },
      data: {
        status: "COMPLETED",
        score: parseInt(feedbackData.score) || 0,
        feedback: feedbackMarkdown,
        transcript: JSON.stringify(transcript),
      },
    });

    console.log("[FEEDBACK] Report saved successfully!");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate report";
    console.error("Feedback Generation Error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
