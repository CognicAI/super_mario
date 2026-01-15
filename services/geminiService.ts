
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export async function fetchQuestions(topic: string): Promise<Question[]> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const prompt = `Generate 5 challenging multiple-choice questions about the topic: "${topic}". 
  Each question must have exactly 4 options. Return the data in valid JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING }
            },
            required: ['id', 'text', 'options', 'correctAnswer']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching questions:", error);
    // Fallback questions if API fails
    return [
      {
        id: 1,
        text: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4"
      }
    ];
  }
}
