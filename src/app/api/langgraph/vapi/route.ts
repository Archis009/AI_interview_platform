import { NextResponse } from "next/server";
import { app } from "@/lib/langgraph";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Vapi sends messages array in OpenAI format
    const messages = body.message?.messages || body.messages || [];
    const callMetadata = body.message?.call?.metadata || body.metadata || {};
    const interviewId = callMetadata.interviewId;

    let jobRole = "Software Engineer";
    
    if (interviewId) {
      const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
      if (interview) jobRole = interview.jobRole;
    }

    // Convert OpenAI messages to LangChain messages
    const lcMessages = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => {
        if (m.role === "user") return new HumanMessage(m.content);
        return new AIMessage(m.content);
      });

    // Run the LangGraph agent
    const result = await app.invoke({
      messages: lcMessages,
      jobRole: jobRole,
    });

    const aiResponse = result.response;

    // Vapi expects OpenAI-compatible SSE stream by default for custom LLMs, 
    // but it also supports returning standard JSON for a single response chunk if streaming is disabled,
    // OR we can mock an SSE stream returning the complete text in one chunk.
    
    // To mock SSE for Vapi:
    const stream = new ReadableStream({
      start(controller) {
        const chunk = {
          id: "chatcmpl-mock",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              delta: { content: aiResponse },
              finish_reason: null,
            },
          ],
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
        
        const finalChunk = {
          id: "chatcmpl-mock",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: "stop",
            },
          ],
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(finalChunk)}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Vapi Custom LLM Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
