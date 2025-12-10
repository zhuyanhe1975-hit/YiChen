
import { GoogleGenAI } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION, DEFAULT_AI_CONFIG } from '../constants';
import { KnowledgeMapData, BatchItem, SubjectGuidelines, TimelineData, VertexAIConfig, TencentConfig, AlibabaRAGConfig, RAGProvider, AIConfig } from '../types';

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

// Helper to resolve API Key
const getEffectiveApiKey = (aiConfig: AIConfig) => {
  if (aiConfig.apiKey && aiConfig.apiKey.trim() !== '') return aiConfig.apiKey;
  // Fallback to env key ONLY for Gemini default provider or if provider matches
  if ((aiConfig.provider === 'gemini') && process.env.API_KEY) return process.env.API_KEY;
  return '';
};

// Helper to clean Base URL (remove trailing slash)
const cleanBaseUrl = (url?: string) => {
    if (!url) return '';
    return url.replace(/\/+$/, '');
};

const tryParseJSON = (jsonString: string): any => {
  if (!jsonString) return null;

  // 1. Aggressive Extraction: Find the outermost JSON object or array
  const firstOpenBrace = jsonString.indexOf('{');
  const firstOpenBracket = jsonString.indexOf('[');
  
  let startIndex = -1;
  let isObject = false;

  // Determine if we are looking for an object or array starting first
  if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
      startIndex = firstOpenBrace;
      isObject = true;
  } else if (firstOpenBracket !== -1) {
      startIndex = firstOpenBracket;
      isObject = false;
  }

  if (startIndex === -1) {
      // Common case for plain text errors or chatty responses without JSON
      return null;
  }

  // Find the LAST matching closer
  const lastCloseBrace = jsonString.lastIndexOf('}');
  const lastCloseBracket = jsonString.lastIndexOf(']');
  
  let endIndex = -1;
  if (isObject && lastCloseBrace !== -1) {
      endIndex = lastCloseBrace + 1;
  } else if (!isObject && lastCloseBracket !== -1) {
      endIndex = lastCloseBracket + 1;
  }

  if (endIndex === -1) {
      endIndex = jsonString.length;
  }

  let candidate = jsonString.substring(startIndex, endIndex);

  // 2. Try parsing the extracted candidate
  try {
    return JSON.parse(candidate);
  } catch (e) {
    // 3. If parse fails, attempt repair on the candidate
    let repaired = candidate.trim();
    
    repaired = repaired.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    repaired = repaired.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas

    // Heuristic: Append missing closing brackets/braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    if (repaired.startsWith('{')) {
         for (let i = 0; i < (openBraces - closeBraces); i++) repaired += "}";
    } else if (repaired.startsWith('[')) {
         for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += "]";
         if ((openBraces - closeBraces) > 0) {
              for (let i = 0; i < (openBraces - closeBraces); i++) repaired += "}";
              if (!repaired.endsWith(']')) repaired += "]";
         }
    }

    try { return JSON.parse(repaired); } catch (e2) { 
        // Silently fail or log debug
        // console.debug("JSON Repair failed for text segment");
        return null; 
    }
  }
};

/**
 * GENERIC OPENAI-COMPATIBLE FETCH
 */
const callOpenAICompatible = async (
  prompt: string,
  aiConfig: AIConfig,
  systemInstruction: string,
  imageBase64?: string
) => {
  const apiKey = getEffectiveApiKey(aiConfig);
  if (!apiKey) throw new Error(`请在设置中配置 ${aiConfig.provider} 的 API Key`);
  if (!aiConfig.baseUrl) throw new Error("Missing Base URL");

  const baseUrl = cleanBaseUrl(aiConfig.baseUrl);

  const messages: any[] = [
    { role: 'system', content: systemInstruction }
  ];

  if (imageBase64) {
    // OpenAI Vision format
    messages.push({
      role: 'user',
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
        model: aiConfig.modelName,
        messages: messages,
        temperature: 0.7
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error(`连接失败 (CORS) - 浏览器安全限制。\n\n原因：${aiConfig.provider} 的 API 不支持直接从网页前端调用。\n\n解决办法：\n1. 请使用 "Gemini" (Google) \n2. 或配置一个支持 CORS 的本地/云端代理地址作为 Base URL。`);
    }
    throw error;
  }
};

/**
 * BAIDU ERNIE FETCH
 */
const callBaidu = async (
  prompt: string,
  aiConfig: AIConfig,
  systemInstruction: string
) => {
    const apiKey = getEffectiveApiKey(aiConfig);
    if (!apiKey) throw new Error("请在设置中配置百度 Access Token");
    
    // Append system instruction to user prompt for Baidu as system role handling varies
    const fullPrompt = `${systemInstruction}\n\nUser Question: ${prompt}`;

    const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${aiConfig.modelName || 'completions_pro'}?access_token=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: fullPrompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Baidu API Error: ${response.status}`);
        }
        const data = await response.json();
        if (data.error_code) {
            throw new Error(`Baidu Error: ${data.error_msg}`);
        }
        return data.result || "";
    } catch (error: any) {
         if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error(`连接失败 (CORS)。请检查网络或配置代理。`);
        }
        throw error;
    }
};

/**
 * Simulates a search against Tencent Cloud Knowledge Base.
 */
const searchTencentKnowledgeBase = async (query: string, config: TencentConfig): Promise<any[]> => {
  // Mock logic kept for demo purposes
  await new Promise(resolve => setTimeout(resolve, 800)); 
  if (!config.secretId || !config.secretKey) {
      throw new Error("Missing Tencent Credentials");
  }
  return [
    {
      title: "模拟腾讯文档_01.pdf",
      uri: "http://tencent-cloud-mock/doc1",
      snippet: `这是从腾讯云知识库(ID: ${config.knowledgeBaseId})检索到的关于"${query}"的相关模拟内容片段。`
    },
    {
      title: "模拟腾讯文档_02.docx",
      uri: "http://tencent-cloud-mock/doc2",
      snippet: `另一个检索结果片段。Tencent Cloud RAG 服务通常通过 API 接口返回 top-k 相关的文本块。`
    }
  ];
};

/**
 * Call Alibaba Cloud (Bailian/DashScope) Application API for RAG
 */
const queryAlibabaRAG = async (query: string, config: AlibabaRAGConfig): Promise<{ text: string, sources: any[] }> => {
    if (!config.appId || !config.apiKey) {
        throw new Error("Missing Alibaba Cloud Credentials");
    }

    const url = `https://dashscope.aliyuncs.com/api/v1/apps/${config.appId}/completion`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: { prompt: query },
                parameters: { incremental_output: false } // Non-streaming for simplicity in this demo
            })
        });

        if (!response.ok) {
             // Handle 404 (App not found) or 401 (Auth)
            const err = await response.text();
            throw new Error(`Alibaba API Error ${response.status}: ${err}`);
        }

        const data = await response.json();
        
        // Parse Output
        const text = data.output?.text || "No response text";
        const sources: any[] = [];
        
        // Alibaba RAG citations often come in doc_references or similar fields depending on app config
        // Assuming a generic structure or extracting from text references like [1]
        // If the API returns 'doc_references' in output:
        if (data.output?.doc_references && Array.isArray(data.output.doc_references)) {
             data.output.doc_references.forEach((ref: any) => {
                 sources.push({
                     title: ref.title || "Reference Doc",
                     uri: ref.url || "",
                     snippet: ref.snippet || "" // Some APIs provide snippet
                 });
             });
        }

        return { text, sources };

    } catch (error: any) {
        if (error.message && error.message.includes('Failed to fetch')) {
             throw new Error(`连接失败 (CORS)。请检查浏览器是否允许直接访问 Alibaba DashScope API。`);
        }
        throw error;
    }
};

/**
 * INTERNAL UNIFIED AI CALLER
 */
const callAI = async (
    prompt: string,
    aiConfig: AIConfig,
    systemInstruction: string,
    imageBase64?: string,
    vertexConfig?: VertexAIConfig,
    ragProvider: RAGProvider = 'google'
): Promise<{ text: string, sources?: any[] }> => {
    const apiKey = getEffectiveApiKey(aiConfig);

    // 1. Gemini
    if (aiConfig.provider === 'gemini') {
        if (!apiKey) throw new Error("Missing API Key. Please check settings.");
        
        const ai = new GoogleGenAI({ apiKey });
        const modelConfig: any = {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 8192,
        };
        
        // Add Vertex AI Retrieval Tool if applicable
        if (ragProvider === 'google' && vertexConfig?.projectId && vertexConfig?.dataStoreId) {
            const datastoreResource = `projects/${vertexConfig.projectId}/locations/${vertexConfig.location || 'global'}/collections/default_collection/dataStores/${vertexConfig.dataStoreId}`;
            modelConfig.tools = [{ retrieval: { vertexAiSearch: { datastore: datastoreResource } } }];
        }

        const parts: any[] = [];
        if (imageBase64) {
            const { mimeType, data } = extractBase64Data(imageBase64);
            parts.push({ inlineData: { mimeType, data } });
        }
        parts.push({ text: prompt });

        try {
            const response = await ai.models.generateContent({
                model: aiConfig.modelName,
                config: modelConfig,
                contents: { parts }
            });

            let ragSources: any[] = [];
            // Extract Google Grounding Sources
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                 ragSources = response.candidates[0].groundingMetadata.groundingChunks
                    .filter((c: any) => c.retrievedContext)
                    .map((c: any) => ({
                       title: c.retrievedContext.title || "Unknown Source",
                       uri: c.retrievedContext.uri || "",
                       snippet: c.retrievedContext.text || ""
                    }));
            }
            
            return { text: response.text || "", sources: ragSources };
        } catch (e: any) {
             if (e.message?.includes("404") || e.message?.includes("not found")) {
                 throw new Error(`模型 "${aiConfig.modelName}" 未找到或暂不可用 (404)。\n请在设置中切换模型 (例如使用 gemini-1.5-flash)。`);
             }
             throw e;
        }
    } 
    // 2. Baidu
    else if (aiConfig.provider === 'baidu') {
        const text = await callBaidu(prompt, aiConfig, systemInstruction);
        return { text };
    } 
    // 3. OpenAI Compatible
    else {
        const text = await callOpenAICompatible(prompt, aiConfig, systemInstruction, imageBase64);
        return { text };
    }
};

/**
 * MAIN GENERATION FUNCTION
 */
export const generateResponse = async (
  prompt: string, 
  imageBase64?: string,
  guidelines?: SubjectGuidelines,
  vertexConfig?: VertexAIConfig,
  tencentConfig?: TencentConfig,
  alibabaConfig?: AlibabaRAGConfig, // Added
  ragProvider: RAGProvider = 'google',
  aiConfig: AIConfig = DEFAULT_AI_CONFIG
): Promise<{ text: string, sources?: any[] }> => {
  try {
    const systemPrompt = getSystemPrompt(guidelines);
    
    // --- RAG BRANCHING ---
    
    // 1. Alibaba RAG (Direct Application Call)
    // If Alibaba is selected, we bypass the generic `callAI` because Alibaba's App API 
    // handles both retrieval and generation in one go.
    if (ragProvider === 'alibaba' && alibabaConfig && alibabaConfig.appId) {
        return await queryAlibabaRAG(prompt, alibabaConfig);
    }

    // 2. Tencent RAG (Client-side Retrieval Augmentation)
    let augmentedPrompt = prompt;
    let preSources: any[] = [];
    
    if (ragProvider === 'tencent' && tencentConfig && tencentConfig.knowledgeBaseId) {
         try {
            const sources = await searchTencentKnowledgeBase(prompt, tencentConfig);
            const contextText = sources.map((s, i) => `[Document ${i+1}]: ${s.snippet}`).join("\n\n");
            augmentedPrompt = `Based on the following retrieved context from the knowledge base, answer the user's question.\n\nContext:\n${contextText}\n\nUser Question: ${prompt}`;
            preSources = sources;
         } catch (e) {
             console.error("Tencent RAG Error:", e);
             return { text: "连接腾讯云知识库失败，请检查配置。" };
         }
    }

    // 3. Google RAG (Vertex AI) or Standard GenAI
    // Vertex integration is handled inside `callAI` via Gemini tools
    const result = await callAI(augmentedPrompt, aiConfig, systemPrompt, imageBase64, vertexConfig, ragProvider);
    
    // Merge sources if Tencent RAG was used
    if (preSources.length > 0) {
        result.sources = preSources;
    }

    return result;

  } catch (error: any) {
    // Only log if it's not a known handled CORS error (to keep console clean)
    if (!error.message?.includes("CORS")) {
        console.error("AI Generation Error:", error);
    }
    
    let msg = error.message || String(error);
    return { text: `⚠️ 错误: ${msg}` };
  }
};

/**
 * IMAGE GENERATION (IMAGEN)
 */
export const generateImage = async (prompt: string, aiConfig: AIConfig = DEFAULT_AI_CONFIG): Promise<string | null> => {
    try {
        const apiKey = getEffectiveApiKey(aiConfig);
        if (!apiKey) throw new Error("Missing API Key");

        if (aiConfig.provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            
            // Using imagen model via generateImages
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '1:1',
                    outputMimeType: 'image/jpeg'
                }
            });

            const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            if (imageBytes) {
                return `data:image/jpeg;base64,${imageBytes}`;
            }
        } else {
            return null;
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error:", e);
        return null;
    }
};

export const analyzeImageBatch = async (
  images: string[],
  userPrompt: string,
  guidelines?: SubjectGuidelines,
  aiConfig: AIConfig = DEFAULT_AI_CONFIG
): Promise<{ text: string, batchData: BatchItem[] }> => {
  try {
    const apiKey = getEffectiveApiKey(aiConfig);
    if (!apiKey) return { text: "请在设置中配置 API Key", batchData: [] };

    const promptText = `
    Task: Analyze ${images.length} user-uploaded images.
    User Context: ${userPrompt}
    
    Structure:
    {
      "replyText": "Summarize analysis in 1 sentence.",
      "items": [
        {
          "imageIndex": 0,
          "subject": "Math",
          "topic": "Topic Name",
          "content": "Description",
          "analysis": "Analysis (max 50 words)."
        }
      ]
    }
    
    IF JSON GENERATION FAILS due to complex math formulas or content, just provide the raw analysis text directly.
    `;

    // We can reuse callAI but need to handle multiple images differently for OpenAI compatible
    // For simplicity in this demo structure, if it's not Gemini, we might warn or try single loop
    // But let's try to adapt callAI or just use Gemini logic here since this is specialized
    
    if (aiConfig.provider !== 'gemini' && aiConfig.provider !== 'chatgpt' && aiConfig.provider !== 'deepseek' && aiConfig.provider !== 'alibaba') {
         return {
            text: `抱歉，批量图片分析当前仅支持 Gemini, ChatGPT, DeepSeek, Alibaba。`,
            batchData: []
        };
    }

    // Reuse callAI for text response? 
    // Multi-image support in callAI is tricky due to interface. 
    // Let's keep the existing logic but improved error handling.
    
    let textResponse = "";
    
    // ... (Existing logic for Gemini vs OpenAI-compat loop) ...
    // To fix the "Failed to fetch" here, we wrap in try-catch
    
    if (aiConfig.provider === 'gemini') {
         const ai = new GoogleGenAI({ apiKey });
         const parts: any[] = [];
         images.forEach(img => {
            const { mimeType, data } = extractBase64Data(img);
            parts.push({ inlineData: { mimeType, data } });
         });
         parts.push({ text: promptText });
         
         try {
             const response = await ai.models.generateContent({
                model: aiConfig.modelName,
                config: {
                    systemInstruction: "You are a helpful assistant. Try to return JSON if possible, otherwise detail the solution.",
                    temperature: 0.2,
                    // Removed strict responseMimeType to allow text fallback
                },
                contents: { parts }
             });
             textResponse = response.text || "";
         } catch (e: any) {
             if (e.message?.includes("404") || e.message?.includes("not found")) {
                 return { 
                     text: `⚠️ 模型 "${aiConfig.modelName}" 不可用 (404)。\n请在设置中切换为 gemini-1.5-flash 或 gemini-1.5-pro。`, 
                     batchData: [] 
                 };
             }
             throw e;
         }

    } else {
         // OpenAI Compatible Logic
         const contentParts: any[] = [{ type: "text", text: promptText }];
         images.forEach(img => {
             contentParts.push({
                 type: "image_url",
                 image_url: { url: img } 
             });
         });
         
         // Use manual fetch to control headers/cors
         const baseUrl = cleanBaseUrl(aiConfig.baseUrl);
         if (!baseUrl) throw new Error("Missing Base URL");

         try {
             const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: aiConfig.modelName,
                    messages: [
                        { role: 'system', content: "You are a JSON generator. Return JSON only." },
                        { role: 'user', content: contentParts }
                    ],
                    temperature: 0.2
                })
             });
             
             if (!response.ok) throw new Error(`API Error: ${response.status}`);
             const data = await response.json();
             textResponse = data.choices?.[0]?.message?.content || "";
         } catch (e: any) {
             if (e.message && e.message.includes("Failed to fetch")) {
                 return { text: "连接失败 (CORS)。请使用 Gemini 或配置代理。", batchData: [] };
             }
             throw e;
         }
    }

    try {
      const result = tryParseJSON(textResponse);
      if (result) {
          return {
            text: result.replyText || "分析完成！",
            batchData: Array.isArray(result.items) ? result.items : []
          };
      }
      // JSON Parse Failed (Common for complex Geometry/Math)
      // Fallback: Return raw text so user can at least see the solution!
      return {
          text: textResponse, // The raw explanation
          batchData: [] // Empty structured data means no cards, but text will show
      };
    } catch (e) {
        // Fallback catch-all
        return { text: textResponse || "数据解析中断。", batchData: [] };
    }

  } catch (error) {
    console.error("Batch Analysis Error:", error);
    return { text: "分析服务暂时不可用。", batchData: [] };
  }
};

export const generateKnowledgeMap = async (concept: string, aiConfig: AIConfig = DEFAULT_AI_CONFIG): Promise<KnowledgeMapData | null> => {
    try {
        const prompt = `
        Analyze concept: "${concept}". 
        Return Valid JSON ONLY. 
        Schema:
        { 
          "center": { "label": "string", "description": "short definition (10-15 words)" },
          "parents": [{ "label": "string", "description": "relationship (5-10 words)" }],
          "children": [{ "label": "string", "description": "relationship (5-10 words)" }],
          "related": [{ "label": "string", "description": "relationship (5-10 words)" }] 
        }`;
        
        // Use callAI directly
        const resp = await callAI(prompt, aiConfig, "You are a JSON generator. Return JSON only.", undefined, undefined, 'google');
        return tryParseJSON(resp.text);
    } catch(e) { return null; }
};

export const generateTimeline = async (topic: string, aiConfig: AIConfig = DEFAULT_AI_CONFIG): Promise<TimelineData | null> => {
    try {
        const prompt = `
        Task: Generate historical timeline for "${topic}".
        Format: JSON Object ONLY. No markdown. No conversational filler.
        Schema: { "title": "string", "events": [{ "date": "string", "title": "string", "description": "string" }] }
        `;
        const resp = await callAI(prompt, aiConfig, "You are a JSON generator. Return JSON only.", undefined, undefined, 'google');
        return tryParseJSON(resp.text);
    } catch(e) { 
        console.error("Timeline Gen Error:", e);
        return null; 
    }
};

export const analyzeWeakness = async (wrongTopics: string[], aiConfig: AIConfig = DEFAULT_AI_CONFIG): Promise<any> => {
     try {
        const prompt = `Based on wrong topics: ${JSON.stringify(wrongTopics)}. Provide 3 suggestions. JSON ONLY. Schema: { "suggestions": [{"focusArea": "string", "suggestion": "string", "difficulty": "string"}] }`;
        const resp = await callAI(prompt, aiConfig, "Return JSON only.", undefined, undefined, 'google');
        return tryParseJSON(resp.text) || { suggestions: [] };
    } catch(e) { return { suggestions: [] }; }
};
