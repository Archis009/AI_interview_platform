import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, BaseMessage } from "@langchain/core/messages";

// 1. Define the State
export const InterviewState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  jobRole: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "Software Engineer",
  }),
  evaluation: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  nextAction: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

const llm = new ChatOpenAI({
  modelName: "llama-3.1-8b-instant",
  temperature: 0.7,
  openAIApiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: "https://api.groq.com/openai/v1"
  }
});

// 2. Node: Evaluate the last answer
async function evaluateAnswer(state: typeof InterviewState.State) {
  const lastUserMessage = state.messages.filter((m) => m._getType() === "human").pop();
  
  // If no user messages yet, we just start
  if (!lastUserMessage) {
    return { evaluation: "none", nextAction: "next_question" };
  }

  // Very fast evaluation prompt
  const evalPrompt = new SystemMessage(`You are an expert technical interviewer evaluating a candidate for a ${state.jobRole} role.
Analyze the candidate's last answer. Is it strong, weak, or incomplete? Do they need a follow-up question to clarify, or should you move on to the next topic?
Output exactly one word: "FOLLOW_UP" or "NEXT_QUESTION".`);
  
  const res = await llm.invoke([evalPrompt, lastUserMessage]);
  const decision = res.content.toString().trim().toUpperCase().includes("FOLLOW_UP") ? "follow_up" : "next_question";
  
  return { nextAction: decision };
}

// 3. Node: Generate Response
async function generateResponse(state: typeof InterviewState.State) {
  let systemPromptText = `You are an expert technical interviewer for a ${state.jobRole} role.
Your responses MUST be spoken naturally. Be conversational, concise, and professional.
Do not output markdown, bullet points, or code blocks. Speak as if on a phone call.`;

  if (state.nextAction === "follow_up") {
    systemPromptText += `\nThe candidate's last answer was incomplete or weak. Ask a short, probing follow-up question to dig deeper into their previous answer.`;
  } else {
    systemPromptText += `\nMove on to a new, distinct interview question relevant to a ${state.jobRole}.`;
  }

  const sysMsg = new SystemMessage(systemPromptText);
  const response = await llm.invoke([sysMsg, ...state.messages]);
  
  return { response: response.content.toString() };
}

// 4. Build the Graph
const workflow = new StateGraph(InterviewState)
  .addNode("evaluate", evaluateAnswer)
  .addNode("generate", generateResponse)
  .addEdge("evaluate", "generate")
  .addEdge("generate", END)
  .addEdge("__start__", "evaluate");

export const app = workflow.compile();
