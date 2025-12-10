
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from '../constants';
import { KnowledgeMapData, Subject, BatchItem, SubjectGuidelines, TimelineData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_TEXT = 'gemini-2.5-flash';

// Helper to construct full system instruction
const getSystemPrompt = (guidelines?: SubjectGuidelines) => {
  let prompt = BASE_SYSTEM_INSTRUCTION;
  if (guidelines) {
    prompt += "\n\n【学科特定行为准则（Subject Specific Guidelines）】\n";
    Object.entries(guidelines).forEach(([subject, rule]) => {
      if (rule.trim()) {
        prompt += `- ${subject}学科：${rule}\n`;
      }
    });
    prompt += "\n请严格遵守以上学科准则进行回复。";
  }
  return prompt;
};

// Helper to extract MIME type and Base64 data from Data URI
const extractBase64Data = (dataURI: string) => {
  if (!dataURI.includes(',')) {
    return { mimeType: 'image/jpeg', data: dataURI };
  }
  
  const matches = dataURI.match(/^data:([^;]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  
  // Fallback
  return { mimeType: 'image/jpeg', data: dataURI.split(',')[1] };
};

// Helper to get formatted model instance
const getModel = (modelName: string, jsonMode: boolean = false, guidelines?: SubjectGuidelines) => {
  const config: any = {
    systemInstruction: getSystemPrompt(guidelines),
    temperature: 0.7,
    maxOutputTokens: 8192, // Ensure enough length for detailed analysis
  };
  
  if (jsonMode) {
    config.responseMimeType = "application/json";
  }

  return { model: modelName, config };
};

export const generateResponse = async (
  prompt: string, 
  imageBase64?: string,
  guidelines?: SubjectGuidelines
): Promise<string> => {
  try {
    const parts: any[] = [];
    
    if (imageBase64) {
      const { mimeType, data } = extractBase64Data(imageBase64);
      parts.push({
        inlineData: {
          mimeType: mimeType, 
          data: data
        }
      });
    }
    
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      ...getModel(MODEL_TEXT, false, guidelines),
      contents: { parts }
    });

    return response.text || "抱歉，由于元气弹能量不足，我暂时无法回答。请稍后再试！";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "糟糕！通信被干扰了（API Error）。请检查网络连接！";
  }
};

export const analyzeImageBatch = async (
  images: string[],
  userPrompt: string,
  guidelines?: SubjectGuidelines
): Promise<{ text: string, batchData: BatchItem[] }> => {
  try {
    const parts: any[] = [];
    
    images.forEach(img => {
      const { mimeType, data } = extractBase64Data(img);
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: data
        }
      });
    });

    // Instructions optimized for brevity and strict JSON output to prevent truncation
    // English instructions for structure are often followed better by the model
    const promptText = `
    Task: Analyze ${images.length} user-uploaded images.
    User Context: ${userPrompt}
    
    OUTPUT FORMAT: JSON ONLY.
    
    Requirements:
    1. Identify the subject (Must be one of: 语文, 数学, 英语, 物理, 化学, 历史, 地理, 生物) and specific topic for EACH image.
    2. Provide a detailed analysis for each image based on the [Subject Specific Guidelines].
    3. If multiple images are related, treat them as a set but provide an entry for each.
    
    CRITICAL CONSTRAINTS (To prevent errors):
    - "replyText": ONE short energetic sentence (Max 30 words). NO REPETITION. NO LOOPS.
      Example: "欧斯！小战士，这些图片里的知识点很有趣，我已经为你整理好了！"
    - "analysis": Detailed but concise (Max 300 words per image). Use Markdown.
    - DO NOT generate infinite text loops. STOP after the JSON is complete.
    
    JSON Structure matches the provided schema.
    `;

    parts.push({ text: promptText });

    const baseModel = getModel(MODEL_TEXT, true, guidelines);
    
    const response = await ai.models.generateContent({
      model: baseModel.model,
      contents: { parts },
      config: {
        ...baseModel.config,
        // Override temperature to be lower for structural tasks to prevent hallucination loops
        temperature: 0.2, 
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  imageIndex: { type: Type.INTEGER },
                  subject: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  content: { type: Type.STRING },
                  analysis: { type: Type.STRING }
                },
                required: ["imageIndex", "subject", "topic", "content", "analysis"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    try {
      const result = JSON.parse(text);
      return {
        text: result.replyText,
        batchData: result.items as BatchItem[]
      };
    } catch (parseError) {
      console.error("Batch Analysis JSON Parse Error:", parseError);
      // Attempt to salvage if it's just a text wrapper issue (though Schema mode shouldn't have this)
      // If truncation happened, we return a friendly error.
      return {
        text: "欧斯！检测到能量波动（分析数据过长导致截断）。\n\n**建议：**\n1. 请尝试减少一次上传的图片数量（建议1-2张）。\n2. 你的知识储备太丰富了，我的分析波装不下了！",
        batchData: []
      };
    }

  } catch (error) {
    console.error("Batch Analysis Error:", error);
    return {
      text: "抱歉，多重残像拳太快了，我没能看清所有图片！(API Error)",
      batchData: []
    };
  }
};

export const generateKnowledgeMap = async (concept: string): Promise<KnowledgeMapData | null> => {
  try {
    const prompt = `分析知识点: "${concept}"。请返回一个JSON对象，包含以下字段：
    - center: "${concept}"
    - parents: (数组，该知识点的前置或上级概念，最多2个)
    - children: (数组，该知识点的子概念或延伸，最多3个)
    - related: (数组，相关联的其他概念，最多3个)
    只返回JSON数据。`;

    const response = await ai.models.generateContent({
      ...getModel(MODEL_TEXT, true),
      contents: prompt,
      config: {
        ...getModel(MODEL_TEXT, true).config,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            center: { type: Type.STRING },
            parents: { type: Type.ARRAY, items: { type: Type.STRING } },
            children: { type: Type.ARRAY, items: { type: Type.STRING } },
            related: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["center", "parents", "children", "related"]
        }
      }
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as KnowledgeMapData;
  } catch (error) {
    console.error("Knowledge Map Generation Error:", error);
    return null;
  }
};

export const generateTimeline = async (topic: string): Promise<TimelineData | null> => {
  try {
    const prompt = `Task: Generate a historical timeline for the topic: "${topic}".
    Requirements:
    1. Identify key historical events related to the topic.
    2. Return a JSON object with a title and a list of events.
    3. Each event must have a date (year or specific date), a title, and a brief description.
    4. Sort events chronologically.
    5. Limit to 6-10 most important events to keep the visual clean.
    `;

    const response = await ai.models.generateContent({
      ...getModel(MODEL_TEXT, true),
      contents: prompt,
      config: {
        ...getModel(MODEL_TEXT, true).config,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["date", "title", "description"]
              }
            }
          },
          required: ["title", "events"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as TimelineData;
  } catch (error) {
    console.error("Timeline Generation Error:", error);
    return null;
  }
};

export const analyzeWeakness = async (wrongTopics: string[]): Promise<any> => {
  try {
    const prompt = `基于以下错题知识点列表：${JSON.stringify(wrongTopics)}。
    分析学生的薄弱环节，并给出3条具体的“超级赛亚人”修炼建议（Json格式）。
    格式：{ "suggestions": [ { "focusArea": "...", "suggestion": "...", "difficulty": "Basic" | "Super Saiyan" | "Super Saiyan God" } ] }`;

    const response = await ai.models.generateContent({
      ...getModel(MODEL_TEXT, true),
      contents: prompt,
    });

    const text = response.text;
    return text ? JSON.parse(text) : { suggestions: [] };
  } catch (error) {
    console.error("Weakness Analysis Error:", error);
    return { suggestions: [] };
  }
};
