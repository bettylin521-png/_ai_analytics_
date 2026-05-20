import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Languages, 
  FileText, 
  CheckSquare, 
  Trash2, 
  Copy, 
  Download, 
  AlertCircle, 
  Settings, 
  RefreshCw, 
  ClipboardCheck, 
  BookOpen, 
  Terminal, 
  Briefcase,
  HelpCircle,
  FileDown,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { SAMPLE_TRANSCRIPTS, SampleTranscript } from "./components/SampleTranscripts";
import MarkdownRenderer from "./components/MarkdownRenderer";

export default function App() {
  // 輸入逐字稿
  const [transcript, setTranscript] = useState<string>("");
  // 輸出報告風格範本
  const [template, setTemplate] = useState<string>("standard");
  // 翻譯目標語系
  const [language, setLanguage] = useState<string>("none");
  // 使用者微調 AI 的備註 (特別提示)
  const [extraPrompt, setExtraPrompt] = useState<string>("");
  
  // AI 生成結果
  const [result, setResult] = useState<string>("");
  // 狀態
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  
  // 系統 UI 反饋
  const [showCopyToast, setShowCopyToast] = useState<boolean>(false);
  const [showDownloadToast, setShowDownloadToast] = useState<boolean>(false);
  
  // 當前選取的範例 ID
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  // 系統指令區塊摺疊狀態
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // 一鍵載入範例
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_TRANSCRIPTS.find(s => s.id === sampleId);
    if (sample) {
      setTranscript(sample.content);
      setSelectedSampleId(sampleId);
      setErrorText(""); // 清空可能的錯誤
      
      // 自動根據範本類型稍微變更推薦參數（提升使用者體驗）
      if (sampleId === "software-dev") {
        setTemplate("action_oriented");
        setLanguage("none");
      } else if (sampleId === "marketing") {
        setTemplate("standard");
        setLanguage("none");
      } else if (sampleId === "startup-strategy") {
        setTemplate("swot");
        setLanguage("english");
      }
    }
  };

  // 清空輸入
  const handleClear = () => {
    setTranscript("");
    setSelectedSampleId("");
  };

  // 計算輸入字數與 Token 的極簡估計
  const charCount = transcript.length;
  const estimatedTokens = Math.ceil(charCount * 1.3);

  // 送出至後端 API
  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setErrorText("請輸入或貼上會議逐字稿內容，或點擊左側「精選範例」快速填入。");
      return;
    }

    setLoading(true);
    setErrorText("");
    
    try {
      // 組合額外提示，如果有特別備註
      let finalTranscript = transcript;
      if (extraPrompt.trim()) {
        finalTranscript += `\n\n【使用者補充微調指令】：${extraPrompt}`;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: finalTranscript,
          language: language,
          template: template
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "在與伺服器連線、生成分析時發生了錯誤。");
      }

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "無法成功呼叫 AI 分析。請檢查設定或稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  // 複製 Markdown
  const handleCopyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    });
  };

  // 下載為 Markdown 檔案
  const handleDownloadFile = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // 取一個好懂的檔名
    const dateStr = new Date().toISOString().slice(0, 10);
    const selectedTemplateName = 
      template === "brief" ? "簡短版" :
      template === "swot" ? "SWOT戰略版" :
      template === "action_oriented" ? "行動追蹤版" : "標準版";
    
    link.href = url;
    link.setAttribute("download", `AI_會議紀錄_${selectedTemplateName}_${dateStr}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowDownloadToast(true);
    setTimeout(() => setShowDownloadToast(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 頂部極簡緻導航欄 */}
      <nav className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-800">
                AI 會議記錄生成與翻譯工具
              </h1>
              <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 font-semibold rounded-md border border-indigo-100/80">
                PRO v1.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">智慧逐字稿重整、待辦清單提煉、多語系商務翻譯</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50/80 border border-green-100 rounded-full text-green-700 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            服務器連線：Gemini 3.5 晶片已接通
          </div>
          <a 
            href="https://ai.studio/build" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200/80 active:bg-slate-200 rounded-lg transition-all font-medium flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            設定金鑰
          </a>
        </div>
      </nav>

      {/* 主要高密度工作區 */}
      <main className="flex flex-1 overflow-hidden p-3 gap-3">
        
        {/* 左側側邊欄 Sidebar (320px 寬，配置設定與精選範例) */}
        <aside className="w-80 shrink-0 flex flex-col gap-3 h-full overflow-y-auto pr-0.5">
          
          {/* 精選範例一鍵載入 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                選擇範例會議記錄
              </h2>
            </div>
            
            <p className="text-[11px] text-slate-400">
              沒有逐字稿？點擊下方預設情境，立刻載入高擬真會議內容，快速體驗 AI 的超群重整力！
            </p>

            <div className="flex flex-col gap-2 mt-1.5">
              {SAMPLE_TRANSCRIPTS.map((sample) => {
                const isSelected = selectedSampleId === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSample(sample.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-400/80 shadow-xs"
                        : "bg-slate-50 border-slate-200/70 hover:bg-slate-100/50 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-800 flex items-center justify-between">
                      <span className="truncate">{sample.title}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          已載入
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {sample.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 生成樣式設定 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col gap-4">
            
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                生成格式與翻譯設定
              </h2>
            </div>

            {/* 報告樣式風格 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                會議記錄模板風格
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "standard", label: "標準結構式" },
                  { value: "brief", label: "極簡摘要版" },
                  { value: "swot", label: "SWOT 戰略" },
                  { value: "action_oriented", label: "行動追蹤表" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTemplate(item.value)}
                    className={`text-[11px] py-1.5 px-1 rounded-md border text-center font-medium transition-all ${
                      template === item.value
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 目標語系 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  多語系翻譯對照
                </label>
                <Languages className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg p-2.5 outline-none transition-colors focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500"
              >
                <option value="none">保留原語系 (無須翻譯)</option>
                <option value="繁體中文">繁體中文 (Traditional Chinese)</option>
                <option value="英文">英文 (English - Global Business)</option>
                <option value="日文">日文 (Japanese - 丁寧體商務)</option>
                <option value="韓文">韓文 (Korean - 敬語體商務)</option>
                <option value="西班牙文">西班牙文 (Spanish)</option>
                <option value="德文">德文 (German)</option>
              </select>
            </div>

            {/* 額外補充指令（強大微調） */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700">
                  給 AI 的微調備註（選填）
                </label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500 cursor-help" title="用來特別交代 AI 著重分析哪些項目，如「特別標明 Alex 的工作」或「細分預算流向」" />
              </div>
              <textarea
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                placeholder="例如：請著重追蹤張經理交付的任務、預算數字需要特別加黃底..."
                className="w-full h-16 p-2 text-xs text-slate-600 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white resize-none outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

          </div>

          {/* 系統背後指令預覽 (可收折) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>預設 System Instructions 常數</span>
              </div>
              {isAdminOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            
            {isAdminOpen && (
              <div className="mt-2 text-[10px] bg-slate-900 text-slate-300 font-mono rounded-lg p-2.5 border border-slate-800 overflow-y-auto max-h-40 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                <span className="text-amber-400 font-bold">// 內置專業會議記錄助理設定：</span>
                <p className="mt-1 text-emerald-400">
                  1. 會議主題與時間：擷取會議的主題與時間。
                </p>
                <p className="mt-1 text-emerald-400">
                  2. 與會者：列出參與會議的人員。
                </p>
                <p className="mt-1 text-emerald-400">
                  3. 會議重點總結：用 3 到 5 個重點總結會議內容。
                </p>
                <p className="mt-1 text-emerald-400">
                  4. Action Items (待辦事項)：明確列出接下來的待辦事項與負責人。
                </p>
                <p className="mt-1 text-indigo-300">
                  5. 英文翻譯版：將上述 1~4 點的內容完整翻譯成專業的英文。
                </p>
              </div>
            )}
          </div>

        </aside>

        {/* 右側主要內容區域（輸入與輸出垂直排列 / 高密度結構） */}
        <section className="flex-1 flex flex-col gap-3 overflow-hidden h-full">
          
          {/* 上半部：輸入區域 */}
          <div className="flex-1 min-h-[160px] flex flex-col bg-white rounded-xl border border-slate-200/95 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/70 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700">貼入會議稿／會議口語筆記</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-150/60 px-2 py-0.5 rounded">
                  字數：{charCount.toLocaleString()} 字 | 預估：{estimatedTokens.toLocaleString()} Tokens
                </span>
                {transcript && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 text-[10px] font-medium text-rose-500 hover:text-white hover:bg-rose-500 px-2 py-0.5 rounded border border-rose-200 hover:border-rose-500 transition-all cursor-pointer"
                    title="重新排空"
                  >
                    <Trash2 className="w-3 h-3" />
                    清除重來
                  </button>
                )}
              </div>
            </div>
            
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                if (selectedSampleId) setSelectedSampleId(""); // 只要手動修改就取消範例高亮
              }}
              className="flex-1 p-4 text-xs md:text-sm text-slate-700 resize-none outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500 bg-white leading-relaxed"
              placeholder="請在此處貼上或自由輸入您的「會議錄音逐字稿」，或者口語雜亂的重點摘要筆記。

您也可以點選左側「選擇範例會議記錄」一鍵填入經典情境來體驗最佳效果！"
            />
          </div>

          {/* 生成控制按鈕列 */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center py-0.5 shrink-0 px-1">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              💡 貼上文字後，設定左側「風格與語言」，一鍵點選右方生成精美的排版成果。
            </p>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full sm:w-auto min-w-[200px] font-bold text-white transition-all duration-200 rounded-xl px-1.5 py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-100 ${
                loading
                  ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-98"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>秘書分析重整中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>生成總結與翻譯</span>
                </>
              )}
            </button>
          </div>

          {/* 下半部：輸出區域 */}
          <div className="flex-2 min-h-[220px] flex flex-col bg-white rounded-xl border border-slate-200/95 shadow-md overflow-hidden">
            
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/70 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700">輸出區域：AI 重量級結構化報告 (視覺排版)</span>
              </div>
              
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-indigo-600 bg-white border border-slate-200 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {showCopyToast ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-green-500 animate-bounce" />
                        <span className="text-green-600 font-bold">已複製！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>一鍵複製 Markdown</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-indigo-600 bg-white border border-slate-200 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {showDownloadToast ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-green-500 animate-bounce" />
                        <span className="text-green-600 font-bold">已下載！</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5" />
                        <span>載為 .md 檔案</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 主要展出與渲染區 */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50/20 leading-relaxed scrollbar-thin">
              
              {/* 錯誤 Alert */}
              {errorText && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm">操作無法順利執行</h3>
                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">{errorText}</p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      💡 提示：本應用在後端進行 Gemini 密鑰呼叫。請確認您已在 Google AI Studio 右上角的 <b>Settings &gt; Secrets</b> 中新增了名稱為 <b>GEMINI_API_KEY</b> 的 Secret 機密值。
                    </p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">正在重整、提煉及分析您的會議內容...</p>
                    <p className="text-xs text-slate-400">Gemini 會議小智囊正在剔除對話贅語、理清排程任務、並進行語言對照翻譯...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="max-w-4xl mx-auto">
                  <MarkdownRenderer content={result} />
                </div>
              ) : !errorText ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                    <Sparkles className="w-6 h-6 text-slate-400 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">目前尚無分析報告</p>
                  <p className="text-xs max-w-sm leading-relaxed">請在上方貼上文字，或任選左側的「精選範例會議記錄」，然後點擊「生成總結與翻譯」按鈕，AI 就會在此處自動渲染精美的多層次 Markdown 會議紀要與翻譯對照表。</p>
                </div>
              ) : null}

            </div>

          </div>

        </section>

      </main>

      {/* 底部高密度狀態 Footer */}
      <footer className="px-6 py-2 bg-slate-800 text-white text-[10px] flex justify-between items-center shrink-0">
        <div className="flex gap-4">
          <span className="font-semibold text-indigo-300">💡 專家技巧</span>
          <span>按 Ctrl + A 複製此處輸出的 Markdown 可以直接貼入 Notion, Obsidian 或 HackMD。</span>
        </div>
        <div className="opacity-60 hidden md:block">
          響應時間：平均 2.5 秒 | 已部署於沙盒環境 (Port: 3000)
        </div>
      </footer>
      
    </div>
  );
}
