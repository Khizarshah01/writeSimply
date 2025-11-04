import React, { useRef, useEffect, useState, useCallback } from "react";
import quotes from "../../assets/motivationalQuotes.json";

interface EditorProps {
    font: string;
    fontSize: number;
    theme?: string;
    content?: string;
    onContentChange?: (content: string) => void;
    onTextSelect?: (pos: { x: number; y: number } | null) => void; // 👈 added
}

const MarkdownEditor: React.FC<EditorProps> = ({
    font,
    fontSize,
    theme,
    content = "",
    onContentChange,
    onTextSelect,
}) => {
    const [placeholder, setPlaceholder] = useState("");
    const [localContent, setLocalContent] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Get random placeholder
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

    useEffect(() => {
        setPlaceholder(getRandomQuote());
        textareaRef.current?.focus();
    }, [getRandomQuote]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalContent(val);
        onContentChange?.(val);
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            onTextSelect?.({ x: rect.left + rect.width / 2, y: rect.top - 50 });
        } else {
            onTextSelect?.(null);
        }
    };

    return (
        <>
            <textarea
                ref={textareaRef}
                value={localContent}
                onChange={handleChange}
                onMouseUp={handleMouseUp}
                className="w-full max-w-4xl h-full p-8 leading-relaxed resize-none border-none outline-none bg-[var(--background)] text-[var(--text-color)] caret-blue placeholder-gray-500"
                style={{ fontFamily: font, fontSize: `${fontSize}px`, lineHeight: "1.6" }}
                placeholder={placeholder}
                spellCheck={false}
            />
        </>
    );
};

export default MarkdownEditor;
