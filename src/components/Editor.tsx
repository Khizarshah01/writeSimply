import React, { useState, useRef, useEffect, useCallback } from "react";
import quotes from "../assets/motivationalQuotes.json";
import EditorRoot from "./Editor/EditorRoot";

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

  return (
  // <div className="flex-1 flex justify-center items-center px-4 overflow-hidden">
  //   <textarea
  //     ref={textareaRef}
  //     value={localContent}
  //     onChange={handleChange}
  //     onKeyDown={handleKeyDown}
  //     className={`
  //       w-full max-w-4xl h-full p-8 
  //       leading-relaxed resize-none 
  //       border-none outline-none 
  //       bg-[var(--background)] text-[var(--text-color)]
  //       caret-blue transition-all duration-300
  //       placeholder-gray-500
  //     `}
  //     style={{
  //       fontFamily: font,
  //       fontSize: `${fontSize}px`,
  //       lineHeight: "1.6",
  //       scrollbarWidth: "none",
  //       msOverflowStyle: "none",
  //     }}
  //     placeholder={placeholder}
  //     spellCheck={false}
  //   />
  // </div>
  <>
  <EditorRoot />
  </>
  );
};

export default Editor;