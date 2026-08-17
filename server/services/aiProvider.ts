import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Official production Groq API models in priority order
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

/**
 * Generates content using Groq API as primary AI provider,
 * falling back to Gemini API if Groq is unavailable.
 */
export async function generateContentWithAI(prompt: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY || "";

  if (groqApiKey) {
    for (const model of GROQ_MODELS) {
      try {
        console.log(`🤖 Attempting Groq API generation with model: ${model}...`);
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          },
          {
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 60000,
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content) {
          console.log(`✅ Groq AI successfully responded using model: ${model}`);
          return content;
        }
      } catch (groqError: any) {
        console.warn(`⚠️ Groq model '${model}' failed:`, groqError?.response?.data?.error?.message || groqError?.message);
      }
    }
  } else {
    console.warn("⚠️ GROQ_API_KEY is not set in process.env");
  }

  // Gemini API Fallback if Groq key is missing or fails
  if (genAI) {
    try {
      console.log("🤖 Attempting fallback to Gemini API...");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        console.log("✅ Gemini AI successfully responded");
        return text;
      }
    } catch (geminiError: any) {
      console.error("❌ Gemini API fallback failed:", geminiError?.message || geminiError);
    }
  }

  throw new Error("No available AI provider succeeded. Please check GROQ_API_KEY in server environment variables.");
}
