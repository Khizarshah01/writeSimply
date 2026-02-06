import React, { useState, useRef, useEffect, useCallback } from "react";
import quotes from "../assets/motivationalQuotes.json";
import { Lexer } from "../lib/parser/lexer";
import { Parser } from "../lib/parser/parser";
import { renderAST } from "../lib/renderer";
import { RootNode } from "../lib/parser/types";
import FloatingToolbar from "./FloatingToolbar";

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

  // Split View State
  const [isSplitView, setIsSplitView] = useState(false);
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
    if (isSplitView) {
      const lexer = new Lexer(localContent);
      const parser = new Parser(lexer);
      setAst(parser.parse());
    }
  }, [localContent, isSplitView]);

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
  };

  const handleFormat = (format: 'bold' | 'italic' | 'view') => {
    console.log("[Editor] handleFormat called with:", format);
    console.log("[Editor] textarea ref:", textareaRef.current);
    console.log("[Editor] selection:", textareaRef.current?.selectionStart, textareaRef.current?.selectionEnd);

    if (format === 'view') {
      setIsSplitView(prev => !prev);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return; // No selection

    const selectedsub = localContent.substring(start, end);
    let wrapper = '';
    if (format === 'bold') wrapper = '**';
    if (format === 'italic') wrapper = '*';

    const newValue = localContent.substring(0, start) + wrapper + selectedsub + wrapper + localContent.substring(end);

    setLocalContent(newValue);
    onContentChange?.(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
    }, 0);
  };

  return (
    <div
      ref={editorContainerRef}
      className="flex-1 flex justify-center items-center px-4 overflow-hidden relative"
    >
      <FloatingToolbar
        onFormat={handleFormat}
        containerRef={editorContainerRef}
        isRawView={isSplitView}
      />


      {/* Editor Pane */}
      <div className={`transition-all duration-300 h-full ${isSplitView ? 'w-1/2 border-r border-gray-700' : 'w-full max-w-4xl'}`}>
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={`
            w-full h-full p-8 
            leading-relaxed resize-none 
            border-none outline-none 
            bg-[var(--background)] text-[var(--text-color)]
            caret-blue transition-all duration-300
            placeholder-gray-500
          `}
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            lineHeight: "1.6",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>

      {/* Preview Pane (Split View) */}
      {isSplitView && ast && (
        <div
          className="w-1/2 h-full p-8 overflow-y-auto prose dark:prose-invert max-w-none"
          style={{
            fontFamily: font,
            // Usually markdown previews look better with sans/serif separation, but respecting user font
          }}
        >
          {renderAST(ast, 'preview-root')}
        </div>
      )}

      {/* Print View: Visible only when printing */}
      <div
        className="print-only"
        style={{
          fontFamily: font,
          fontSize: `${fontSize}px`,
          lineHeight: "1.6",
        }}
      >
        {isSplitView && ast ? renderAST(ast, 'print-root') : localContent}
      </div>



    </div>
  );
};

export default Editor;