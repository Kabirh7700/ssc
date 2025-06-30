

import { GoogleGenAI, GenerateContentResponse, Chat, GroundingChunk } from "@google/genai";
import { AISuggestionItem } from '../types'; // AISuggestionItem might be removed if no longer used
import { GEMINI_MODEL_TEXT } from '../constants';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

// const parseJsonFromText = <T,>(text: string): T | null => {
//   let jsonStr = text.trim();
//   const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
//   const match = jsonStr.match(fenceRegex);
//   if (match && match[2]) {
//     jsonStr = match[2].trim();
//   }
//   try {
//     return JSON.parse(jsonStr) as T;
//   } catch (e) {
//     console.error("Failed to parse JSON response from AI:", e, "Original text:", text);
//     return null;
//   }
// };

// const handleGeminiError = (error: any, context: 'suggestions' | 'copilot'): { message: string, severity: AISuggestionItem['severity'] } => {
//     console.error(`Error with AI ${context}:`, error);
//     let detailedErrorMessage = `An unexpected error occurred with AI ${context}.`;
//     let severity: AISuggestionItem['severity'] = 'critical';

//     let errorToInspect = error;
//     if (typeof error?.message === 'string') {
//         try {
//             const parsedMessage = JSON.parse(error.message);
//             if (parsedMessage.error) {
//                 errorToInspect = parsedMessage;
//             } else {
//                  detailedErrorMessage = error.message; 
//             }
//         } catch (e) {
//             if (typeof error.message === 'string') {
//                  detailedErrorMessage = error.message;
//             }
//         }
//     }

//     const geminiError = errorToInspect?.error; 

//     if (geminiError && (geminiError.code === 429 || geminiError.status === "RESOURCE_EXHAUSTED")) {
//         detailedErrorMessage = `AI ${context} are temporarily unavailable due to high usage (quota exceeded). Please try again in a few minutes. ${geminiError.message ? `Details: ${geminiError.message}` : ''}`;
//         severity = 'warning';
//     } else if (geminiError && geminiError.message) {
//         detailedErrorMessage = `AI ${context} error: ${geminiError.message}`;
//     } else if (typeof errorToInspect?.message === 'string' && !geminiError) {
//         detailedErrorMessage = errorToInspect.message;
//     }
    
//     return { message: detailedErrorMessage, severity };
// };


// AI Suggestions functionality is being removed from the UI.
// export const getAiSuggestions = async (
//     ordersSummary: any[], // Type was SummarizedOrderForAI[]
//     suppliers: any[] // Type was Supplier[]
// ): Promise<AISuggestionItem[]> => {
//   if (!ai) return Promise.resolve([{ id: 'no-api-key', title: 'AI Disabled', description: 'API Key for Gemini not configured. Suggestions are unavailable.', severity: 'warning' }]);
//   // ... implementation removed ...
//   return Promise.resolve([{ id: 'ai-disabled', title: 'AI Suggestions Disabled', description: 'This feature is currently not active.', severity: 'info' }]);
// };


// AI Copilot functionality is being removed from the UI.
// let chatInstance: Chat | null = null;

// const initializeChat = (): Chat | null => {
//   if (!ai) return null;
//   if (!chatInstance) {
//     // ... chat initialization removed ...
//   }
//   return chatInstance;
// };

export interface CopilotOrderContext { 
    id: string;
    clientName?: string;
    clientCountry?: string;
    currentStage?: string;
    totalFinalPrice?: number;
    itemCount?: number;
    productTypesSummary?: string;
    paymentStatus?: string;
}

export const askAiCopilot = async (
  message: string, 
  currentOrdersSummary?: CopilotOrderContext[] 
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!ai) return Promise.resolve({ text: "AI Copilot is disabled. API Key for Gemini not configured." });
  // Placeholder implementation as AI features are "deactivated"
  console.log("askAiCopilot called with message:", message, "and order summary:", currentOrdersSummary);
  return Promise.resolve({ text: "AI Copilot is currently not active. This is a placeholder response." });
};

// If no functions remain, this file could be deleted or kept for utility functions like parseJsonFromText or handleGeminiError if they are reused elsewhere.
// For now, retaining the structure but commenting out the core logic.
console.log("Gemini Service initialized. AI features (Suggestions, Copilot) are currently deactivated in the UI.");
