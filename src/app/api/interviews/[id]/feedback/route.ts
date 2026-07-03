import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

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
      // If the transcript is empty (user didn't say anything or ended immediately)
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

    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelKwargs: { response_format: { type: "json_object" } }
    });

    const systemPrompt = new SystemMessage(`You are an expert technical recruiter reviewing a ${interview.type} interview transcript for a ${interview.jobRole} role. The candidate is a ${interview.user?.experienceLevel || "Mid-Level"} professional.
    
Analyze the conversation and provide a detailed feedback report. Your response MUST be valid JSON matching this exact structure:
{
  "score": 85,
  "strengths": ["list of 2-3 strong points"],
  "weaknesses": ["list of 2-3 areas for improvement"],
  "detailedFeedback": "A comprehensive paragraph summarizing their performance, communication style, and specific advice for next time."
}`);

    const humanPrompt = new HumanMessage(`Here is the interview transcript:\n\n${transcriptText}`);

    let response;
    try {
      response = await llm.invoke([systemPrompt, humanPrompt]);
    } catch (e) {
      console.error("OpenAI API call failed", e);
      return NextResponse.json({ error: "OpenAI API failed" }, { status: 500 });
    }

    let feedbackData;
    try {
      feedbackData = JSON.parse(response.content.toString());
    } catch (e) {
      console.error("Failed to parse JSON", response.content);
      feedbackData = {
        score: 50,
        strengths: ["Could not determine strengths due to an analysis error."],
        weaknesses: ["Could not determine weaknesses due to an analysis error."],
        detailedFeedback: "An error occurred while generating the detailed feedback."
      };
    }

    // Defensive formatting
    const strengths = Array.isArray(feedbackData.strengths) ? feedbackData.strengths : ["N/A"];
    const weaknesses = Array.isArray(feedbackData.weaknesses) ? feedbackData.weaknesses : ["N/A"];
    
    // Format feedback into markdown for the database
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Feedback Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
