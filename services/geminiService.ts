import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";
import { getTaskStatus } from "../utils/helpers";

const API_KEY = process.env.API_KEY || '';

export const generateProductivityInsight = async (tasks: Task[], query: string): Promise<string> => {
  if (!API_KEY) {
    return "Please configure your API_KEY to use the AI Coach.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Prepare context from tasks
  const recentTasks = tasks
    .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
    .slice(0, 50); // Analyze last 50 tasks to save tokens

  const taskSummary = recentTasks.map(t => 
    `- [${t.assignedDate}] ${t.title} (${t.category}): ${getTaskStatus(t)} ${t.notes ? `(Notes: ${t.notes})` : ''}`
  ).join('\n');

  const prompt = `
    You are a wise, minimalist productivity coach using the "Capital Compass" framework.
    The framework tracks 6 capitals: Skill, Physical, Emotional, Social, Intellectual, Financial.
    
    Here is the user's recent task history (last 50 items):
    ${taskSummary}

    User Query: "${query}"

    Provide a thoughtful, strategic response. Focus on long-term consistency, balance between capitals, and the 3-day grace period mechanic (tasks can be done within 3 days of assignment).
    
    CRITICAL INSTRUCTION: You MUST use your thinking capabilities to analyze the user's habits deeply before answering.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        // maxOutputTokens is intentionally omitted to allow full thinking output
      }
    });
    return response.text || "I couldn't generate an insight at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while thinking about your schedule.";
  }
};

export const generateTaskNotes = async (title: string, category: string): Promise<string> => {
  if (!API_KEY || !title) return "";

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    Suggest short, actionable notes or a bullet point checklist (max 3 items) for a task titled "${title}" in the "${category}" category.
    Keep it concise, practical, and under 200 characters total. Return ONLY the text.
  `;

  try {
    // Use Flash for faster UI response on simple creative tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Notes Error:", error);
    return "";
  }
};

export const generateWeeklySchedule = async (goal: string): Promise<any[]> => {
  if (!API_KEY) return [];

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    The user wants to proactively plan their upcoming week to achieve a specific goal.
    
    User Goal: "${goal}"
    
    Generate 3 to 5 high-impact, specific tasks that will help them make progress.
    Assign them starting from tomorrow (Day Offset 1) up to Day Offset 5.
    
    Return STRICT JSON format:
    [
      {
        "title": "Task Title",
        "category": "One of [Skill, Physical, Emotional, Social, Intellectual, Financial]",
        "duration": "e.g. 45m",
        "notes": "Brief actionable advice",
        "dayOffset": 1 // integer 1-7
      }
    ]
    
    Do not include markdown code blocks. Return only the JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "[]";
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse schedule JSON", text);
      return [];
    }
  } catch (error) {
    console.error("Gemini Schedule Error:", error);
    return [];
  }
};

export const generateOrEditImage = async (prompt: string, inputImageBase64?: string): Promise<{ imageUrl: string | null, text: string | null }> => {
  if (!API_KEY) return { imageUrl: null, text: "API Key missing" };

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const parts: any[] = [];
    if (inputImageBase64) {
       parts.push({
         inlineData: {
           data: inputImageBase64,
           mimeType: 'image/png' // Assuming PNG or standard image
         }
       });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts }
    });

    let imageUrl = null;
    let text = null;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
           text = part.text;
        }
      }
    }
    
    return { imageUrl, text };
  } catch (e) {
    console.error(e);
    return { imageUrl: null, text: "Failed to process image request." };
  }
};
