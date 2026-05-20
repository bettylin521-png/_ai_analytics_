import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// 建立 Google GenAI 用戶端。
// 遵循 lazy-initialization 原則，避免環境變數缺漏直接導致服務在 init 階段崩潰
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("找不到 GEMINI_API_KEY 環境變數，請在 .env 或伺服器環境變數中配置它。");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'express-server',
        }
      }
    });
  }
  return aiClient;
}

// System Instruction 的設計
const SYSTEM_INSTRUCTION = `你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。
2. **與會者**：列出參與會議的人員。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **英文翻譯版**：將上述 1~4 點的內容完整翻譯成專業的英文。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。`;

// 處理會議記錄生成與翻譯的 API 路由
app.post("/api/generate", async (req, res) => {
  try {
    const { transcript, language, template } = req.body;

    if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
      res.status(400).json({ error: "請提供會議逐字稿內容。" });
      return;
    }

    const ai = getGenAI();

    // 拼湊用戶 Prompt
    let templatePrompt = "";
    switch (template) {
      case "brief":
        templatePrompt = "請採用【極簡摘要與待辦清單】格式，只需列出：1. 1分鐘會議懶人包（3~4個 Bullet points）、2. 關鍵決議、3. 列點式 action items，越乾脆越好。";
        break;
      case "swot":
        templatePrompt = "請採用【SWOT 戰略分析報告】格式，融合會議中有關外部競爭、內部進度、產品進度等對話，生成包含 1. 優勢 (Strengths)、2. 劣勢 (Weaknesses)、3. 機會 (Opportunities)、4. 威脅 (Threats) 的商業矩陣，以及後續建議。";
        break;
      case "action_oriented":
        templatePrompt = "請採用【行動追蹤導向報告】格式，高度注重執行力。請列出：1. 當前關鍵里程碑、2. 用「表格」列出所有待辦任務（包含：任務內容、專案負責人、限期/急迫性度）、3. 風險預警。";
        break;
      case "standard":
      default:
        templatePrompt = "請採用【標準結構化會議記錄】格式，包含：1. 會議基本資訊摘要、2. 會議主旨/核心議程、3. 重點決議區（一目了然）、4. 詳細議程紀實、5. 待辦行動清單與分工。";
        break;
    }

    let translationPrompt = "";
    if (language && language !== "none" && language !== "traditional-chinese") {
      translationPrompt = `請在中文總結之後，提供精準流暢、商務口氣的【${language}】語言翻譯版本。`;
    } else {
      translationPrompt = "不需要額外繙譯，只需呈現繁體中文版本的精緻報告。";
    }

    const userPrompt = `【待處理的會議紀錄來源文字】:
"""
${transcript}
"""

【特定產生格式需求】:
${templatePrompt}

【繙譯需求】:
${translationPrompt}

請幫我分析重整。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // 較低的溫度使其更穩健、不會亂編造
      },
    });

    const resultText = response.text || "無法生成內容，請再試一次。";

    res.json({ result: resultText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "伺服器內部發生未知錯誤" });
  }
});

// Vite 整合配置（在開發模式下使用 Vite，在生產模式下直接提供靜態前端 dist）
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
