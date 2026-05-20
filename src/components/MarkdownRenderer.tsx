import React from "react";
import { motion } from "motion/react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // 1. 將內容分割成段落/區塊進行解析
  // 我們按行拆分，但有些格式（如表格、區塊、代碼區）需要狀態機來跟蹤
  const lines = content.split("\n");
  const elements: React.JSX.Element[] = [];

  let keyIndex = 0;
  let listBuffer: { type: "bullet" | "task"; text: string; checked?: boolean }[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const listKey = `list-${keyIndex++}`;
    elements.push(
      <ul key={listKey} className="my-3 space-y-2 list-none pl-1">
        {listBuffer.map((item, idx) => {
          if (item.type === "task") {
            return (
              <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed font-sans text-sm md:text-base">
                <span className={`inline-flex items-center justify-center shrink-0 w-5 h-5 mt-0.5 rounded-md border ${item.checked ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white'}`}>
                  {item.checked ? (
                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : null}
                </span>
                <span className={item.checked ? 'line-through text-slate-400' : ''}>
                  {parseInlineFormatting(item.text)}
                </span>
              </li>
            );
          } else {
            return (
              <li key={idx} className="flex items-start gap-2.5 text-slate-700 leading-relaxed font-sans text-sm md:text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5 shrink-0" />
                <span>{parseInlineFormatting(item.text)}</span>
              </li>
            );
          }
        })}
      </ul>
    );
    listBuffer = [];
  };

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const tableKey = `table-${keyIndex++}`;

    // 解析表格資料
    const rows = tableBuffer
      .map(line => line.split("|").map(cell => cell.trim()))
      .filter(row => row.length > 1 && row.some(cell => cell !== ""));

    // 排除全是虛線的分割線 rows (例如 |---|---|)
    const formattedRows = rows.filter(row => {
      // 判斷是否為分割行
      const isSeparator = row.every(cell => {
        const cleaned = cell.replace(/[-:\s]/g, "");
        return cleaned === "" || cleaned.length === 0;
      });
      return !isSeparator;
    });

    if (formattedRows.length > 0) {
      const headers = formattedRows[0].slice(1, -1); // 左右兩邊可能留空
      const bodyRows = formattedRows.slice(1);

      elements.push(
        <div key={tableKey} className="my-5 overflow-x-auto border border-slate-200/80 rounded-xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 font-sans text-sm">
            <thead className="bg-slate-50">
              <tr>
                {headers.map((hdr, idx) => (
                  <th key={idx} className="px-4 py-3 text-left font-semibold text-slate-700">
                    {parseInlineFormatting(hdr)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {bodyRows.map((row, rowIdx) => {
                const cells = row.slice(1, -1);
                return (
                  <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                    {cells.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-slate-600 whitespace-normal">
                        {parseInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    tableBuffer = [];
    inTable = false;
  };

  // 處理行內格式化（如 **粗體**、`程式碼` 等）
  function parseInlineFormatting(text: string): React.ReactNode[] {
    if (!text) return [];

    // regex 按優先序匹配
    const parts: React.ReactNode[] = [];
    let currentText = text;

    // 我們可以用一個簡易的分詞模型來解析 **bold** 和 `code` 
    // 以及像 【成員】 / [標記]
    let index = 0;
    while (currentText.length > 0) {
      // 1. 匹配 **粗體**
      const boldMatch = currentText.match(/^([^\*]*)\*\*([^\*]+)\*\*(.*)$/);
      // 2. 匹配 `程式碼`
      const codeMatch = currentText.match(/^([^`]*)`([^`]+)`(.*)$/);

      if (boldMatch && (!codeMatch || boldMatch[1].length <= codeMatch[1].length)) {
        if (boldMatch[1]) {
          parts.push(<span key={index++}>{boldMatch[1]}</span>);
        }
        parts.push(
          <strong key={index++} className="font-semibold text-slate-900 bg-amber-50/60 px-0.5 rounded-sm">
            {boldMatch[2]}
          </strong>
        );
        currentText = boldMatch[3];
      } else if (codeMatch) {
        if (codeMatch[1]) {
          parts.push(<span key={index++}>{codeMatch[1]}</span>);
        }
        parts.push(
          <code key={index++} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-rose-600 border border-slate-200/60">
            {codeMatch[2]}
          </code>
        );
        currentText = codeMatch[3];
      } else {
        // 沒有更多 markdown 符號，處理括號裝飾
        // 對於像 【張經理】 或 [待辦] 這種做點色彩渲染
        const bracketMatch = currentText.match(/^([^【]*)【([^】]+)】(.*)$/);
        if (bracketMatch) {
          if (bracketMatch[1]) {
            parts.push(<span key={index++}>{bracketMatch[1]}</span>);
          }
          parts.push(
            <span key={index++} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100/80 mr-1 shadow-2xs font-sans">
              {bracketMatch[2]}
            </span>
          );
          currentText = bracketMatch[3];
        } else {
          parts.push(<span key={index++}>{currentText}</span>);
          break;
        }
      }
    }

    return parts;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 處理表格
    if (line.startsWith("|")) {
      flushList();
      inTable = true;
      tableBuffer.push(rawLine); // 注意要保留原本包含空格的行以保持對齊結構
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 處理標題
    if (line.startsWith("#")) {
      flushList();
      const level = line.match(/^#+/)?.[0].length || 1;
      const titleText = line.replace(/^#+\s*/, "");

      if (level === 1) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mt-6 mb-4 pb-2 border-b border-slate-200 font-sans">
            {parseInlineFormatting(titleText)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight mt-6 mb-3 flex items-center gap-2 font-sans">
            <span className="w-1.5 h-6 rounded bg-indigo-600 shrink-0 inline-block" />
            {parseInlineFormatting(titleText)}
          </h2>
        );
      } else {
        elements.push(
          <h3 key={`h3-${i}`} className="text-lg md:text-xl font-medium text-slate-800 mt-5 mb-2 font-sans">
            {parseInlineFormatting(titleText)}
          </h3>
        );
      }
      continue;
    }

    // 處理分割線
    if (line === "---" || line === "***") {
      flushList();
      elements.push(
        <div key={`hr-${i}`} className="py-6 my-4 flex items-center justify-center gap-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs font-mono text-slate-400 select-none uppercase tracking-widest font-sans">翻譯與對照語系版本</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
      );
      continue;
    }

    // 處理引用區塊
    if (line.startsWith(">")) {
      flushList();
      const quoteText = line.replace(/^>\s*/, "");
      elements.push(
        <blockquote key={`quote-${i}`} className="pl-4 py-2 my-3 border-l-4 border-amber-500 bg-amber-50/40 text-slate-700 italic rounded-r-lg font-sans">
          {parseInlineFormatting(quoteText)}
        </blockquote>
      );
      continue;
    }

    // 處理代辦/任務列表
    // 匹配例如: - [ ] 或者 - [x]
    const taskMatch = line.match(/^[\-\*]\s+\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === "x";
      const taskText = taskMatch[2];
      listBuffer.push({ type: "task", text: taskText, checked });
      continue;
    }

    // 處理一般列表
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listText = line.substring(2);
      listBuffer.push({ type: "bullet", text: listText });
      continue;
    }

    // 處理空行
    if (line === "") {
      flushList();
      // 我們不直接輸出空行元素，但在多個連續空行時提供段落間距
      continue;
    }

    // 以上都不是，則回歸為一般段落
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-slate-600 leading-relaxed my-3 text-sm md:text-base font-sans">
        {parseInlineFormatting(rawLine)}
      </p>
    );
  }

  // 結尾快篩 Buf
  flushList();
  flushTable();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="prose max-w-none text-slate-800"
    >
      {elements}
    </motion.div>
  );
}
