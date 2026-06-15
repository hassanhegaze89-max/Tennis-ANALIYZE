import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export interface AnalysisResponse {
  strokeType: string;
  feedback: string;
  improvementTips: string[];
  score: number; // 0-100
}

export async function analyzeTennisMotion(frames64: string[]): Promise<string> {
  const ai = getAI();
  
  // We'll use the flash model for quick vision analysis
  const model = "gemini-3-flash-preview";
  
  const contentParts = [
    { text: "أنت مدرب تنس محترف. قم بتحليل الحركة في هذه الصور المتتابعة من ضربة تنس. حدد نوع الضربة (إرسال، ضربة أمامية، ضربة خلفية، إلخ). قم بتقييم وضعية الجسم، أرجحة المضرب، حركة القدمين، والمتابعة. قدم ملاحظات محددة باللغة العربية حول كيفية التحسين. قم بتنسيق الإجابة بشكل جميل باستخدام Markdown." },
    ...frames64.map(data => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: data.split(',')[1] // Remove data:image/jpeg;base64,
      }
    }))
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: contentParts }]
    });
    
    return response.text || "عذراً، لم أتمكن من تحليل الفيديو. يرجى المحاولة مرة أخرى.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "حدث خطأ أثناء تحليل الحركة. يرجى التأكد من اتصال الإنترنت وجودة الفيديو.";
  }
}
