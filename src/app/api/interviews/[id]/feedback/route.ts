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
    const transcriptText = transcript.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n");

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

    console.log("[FEEDBACK] Calling Gemini API...");

    const models = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];
    let geminiRes = null;
    let lastError = "";

    for (const model of models) {
      console.log(`[FEEDBACK] Trying model: ${model}`);
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert technical recruiter reviewing a ${interview.type} interview transcript for a ${interview.jobRole} role. The candidate is a ${interview.user?.experienceLevel || "Mid-Level"} professional.

Analyze the following interview transcript and provide a detailed feedback report. 

IMPORTANT: Your response must be ONLY valid JSON (no markdown, no code fences) matching this exact structure:
{"score": 85, "strengths": ["strength 1", "strength 2", "strength 3"], "weaknesses": ["weakness 1", "weakness 2"], "detailedFeedback": "A comprehensive paragraph summarizing their performance, communication style, and specific advice for next time."}

Here is the interview transcript:

${transcriptText}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (geminiRes.ok) {
        console.log(`[FEEDBACK] Success with model: ${model}`);
        break;
      }

      lastError = await geminiRes.text();
      console.warn(`[FEEDBACK] Model ${model} failed (${geminiRes.status}), trying next...`);
      
      // Wait 2 seconds before trying next model
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!geminiRes || !geminiRes.ok) {
      console.error("[FEEDBACK] All Gemini models failed. Last error:", lastError);
      
      // Save the transcript anyway so it's not stuck in IN_PROGRESS
      await prisma.interview.update({
        where: { id },
        data: {
          status: "COMPLETED",
          score: 0,
          feedback: "### ⚠️ AI Quota Exhausted\n\nYour interview transcript was saved successfully, but we could not generate the AI feedback report because your Gemini API key has run out of its free tier quota for today.\n\nPlease check your billing details or try again tomorrow.",
          transcript: JSON.stringify(transcript),
        },
      });

      return NextResponse.json({ success: true, warning: "Quota exhausted" });
    }

    const geminiData = await geminiRes.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    console.log("[FEEDBACK] Gemini response received, parsing...");

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
  } catch (error: any) {
    console.error("Feedback Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
