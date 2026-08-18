import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Configured Groq API models
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

/**
 * Robust helper to extract valid JSON substring from LLM response text
 */
export function extractJsonFromText(rawText: string): string {
  let cleaned = rawText.trim();
  
  // Remove markdown codeblock syntax if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Find outermost JSON object braces
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Find outermost JSON array brackets if object braces not found
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned;
}

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
            max_tokens: 4096,
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
