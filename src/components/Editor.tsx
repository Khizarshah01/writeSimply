import React, { useState, useRef} from "react";
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