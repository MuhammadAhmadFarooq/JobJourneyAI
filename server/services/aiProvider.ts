import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Generates content using Groq API as primary AI provider,
 * falling back to Gemini API if Groq is unavailable.
 */
export async function generateContentWithAI(prompt: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY || "";

  if (groqApiKey) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "openai/gpt-oss-120b",
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
        return content;
      }
    } catch (groqError: any) {
      console.warn("⚠️ Groq API call failed:", groqError?.response?.data || groqError?.message);
    }
  }

  // Gemini API Fallback
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        return text;
      }
    } catch (geminiError: any) {
      console.error("❌ Gemini API fallback failed:", geminiError?.message || geminiError);
    }
  }

  throw new Error("No available AI provider succeeded. Check GROQ_API_KEY in .env.");
}
