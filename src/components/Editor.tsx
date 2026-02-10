import React, { useState, useRef, useEffect, useCallback } from "react";
import quotes from "../assets/motivationalQuotes.json";
import { Lexer } from "../lib/parser/lexer";
import { Parser } from "../lib/parser/parser";
import { renderAST } from "../lib/renderer";
import { RootNode } from "../lib/parser/types";

interface EditorProps {
  font: string;
  fontSize: number;
  theme?: string;
  content?: string;
  onContentChange?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  font,
  fontSize,
  theme,
  content = "",
  onContentChange
}) => {
  const [placeholder, setPlaceholder] = useState<string>("");
  const [localContent, setLocalContent] = useState<string>(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);


  const [ast, setAst] = useState<RootNode | null>(null);

  // Get random quote
  const getRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  // Initialize placeholder + focus
  useEffect(() => {
    setPlaceholder(getRandomQuote());
    textareaRef.current?.focus();
  }, [getRandomQuote]);

  // Refocus on theme change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [theme]);

  // Handle external "clear" event
  useEffect(() => {
    const handleClear = () => {
      setLocalContent("");
      onContentChange?.("");
      textareaRef.current?.focus();
    };
    window.addEventListener("editor:clear", handleClear);
    return () => window.removeEventListener("editor:clear", handleClear);
  }, [onContentChange]);

  // Sync content from parent
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Parse Content on Change
  useEffect(() => {
    const lexer = new Lexer(localContent);
    const parser = new Parser(lexer);
    setAst(parser.parse());
  }, [localContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onContentChange?.(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart ?? 0;
      const end = e.currentTarget.selectionEnd ?? 0;
      const newValue =
        localContent.substring(0, start) + "  " + localContent.substring(end);
      setLocalContent(newValue);
      onContentChange?.(newValue);

      setTimeout(() => {
        textareaRef.current?.setSelectionRange(start + 2, start + 2);
      }, 0);
    }

    // Auto-close for *
    if (e.key === "*") {
      const start = e.currentTarget.selectionStart ?? 0;
      const end = e.currentTarget.selectionEnd ?? 0;

      // Only if cursor is collapsed (no selection)
      if (start === end) {
        const charBefore = localContent.charAt(start - 1);

        // If user just typed one *, and now types another * -> **
        // We want to turn it into **** with cursor in middle
        if (charBefore === '*') {
          e.preventDefault();
          // Current: ...*|...
          // Result: ...****|... (cursor at index + 2 relative to start)
          // Wait, start is AFTER the first *.
          // So we insert *** at cursor.
          // String becomes ...****...

          const newValue = localContent.substring(0, start) + "***" + localContent.substring(end);
          setLocalContent(newValue);
          onContentChange?.(newValue);

          setTimeout(() => {
            // Start was 1 (after first *). We added ***.
            // We want cursor after 2nd *. So start + 1?
            // * -> (insert ***) -> ****
            // Indexes: 0 1 2 3
            // Before: * (index 0), cursor at 1.
            // After: ****. Cursor should be at 2.
            // So start + 1.
            textareaRef.current?.setSelectionRange(start + 1, start + 1);
          }, 0);
        }
      }
    }
  };

  return (
    <div
      ref={editorContainerRef}
      className="flex-1 flex justify-center items-start px-4 overflow-hidden relative"
    >
      {/* Editor Pane */}
      <div className={`transition-all duration-300 h-full w-full max-w-4xl relative h-full`}
        style={{
          background: "var(--background)", // ✅ background lives HERE
        }}
      >
        {/* Visual Layer - Behind */}
        <div
          ref={previewRef}
          className={`
            w-full h-full p-8 
            leading-relaxed 
            border-none 
            bg-transparent
            absolute inset-0
            pointer-events-none
            overflow-auto
            scrollbar-hide
          `}
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "var(--text-color)",
          }}
        >
          {ast ? renderAST(ast, "preview-root") : localContent}
        </div>

        {/* Input Layer - Top */}
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            if (previewRef.current) {
              previewRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          className={`
    w-full h-full p-8 
    leading-relaxed resize-none 
    border-none outline-none 
    bg-transparent
    absolute inset-0
    z-10
    scrollbar-hide
  `}
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",

            color: "transparent",
            WebkitTextFillColor: "transparent",
            caretColor: theme === "dark" ? "white" : "black",
            background: "rgba(255, 255, 255, 0.15)",
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>

      {/* Print View: Visible only when printing */}
      <div
        className="print-only"
        style={{
          fontFamily: font,
          fontSize: `${fontSize}px`,
          lineHeight: "1.6",
        }}
      >
        {ast ? renderAST(ast, 'print-root') : localContent}
      </div>
    </div >
  );
};

export default Editor;