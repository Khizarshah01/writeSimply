
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    FORMAT_TEXT_COMMAND,
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
    COMMAND_PRIORITY_LOW,
} from "lexical";
import {
    Bold,
    Italic,
    Underline,
    Code,
    Strikethrough
} from "lucide-react";

export default function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsUnderline(selection.hasFormat("underline"));
            setIsCode(selection.hasFormat("code"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
        }
    }, []);

    const updatePosition = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setPosition(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width === 0 && rect.height === 0) {
            setPosition(null);
            return;
        }

        setPosition({
            top: rect.top - 50, // Position above the selection
            left: rect.left + rect.width / 2, // Center horizontally
        });
    }, []);

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                updateToolbar();
            });
        });
    }, [editor, updateToolbar]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload) => {
                updatePosition();
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor, updatePosition]);

    // Also update position on scroll or resize to keep it attached
    useEffect(() => {
        window.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [updatePosition]);


    // Handle click
    const format = (type: "bold" | "italic" | "underline" | "code" | "strikethrough") => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
    };

    const Button = ({ type, active, icon: Icon, onClick }: { type: string, active: boolean, icon: any, onClick: () => void }) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`p-1.5 rounded-md transition-all duration-200 active:scale-95 ${active
                ? 'bg-[var(--text-color)] text-[var(--background)] shadow-sm'
                : 'text-[var(--text-color)] hover:bg-[var(--text-color)]/10 hover:text-[var(--text-color)]'
                }`}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
            type="button"
        >
            <Icon size={18} strokeWidth={2.5} />
        </button>
    );

    const Divider = () => (
        <div className="w-[1px] h-5 bg-[var(--text-color)]/20 mx-1" />
    );

    if (!position) return null;

    return createPortal(
        <div
            ref={toolbarRef}
            style={{
                top: position.top,
                left: position.left,
                transform: "translateX(-50%)",
            }}
            className="flex items-center gap-1 p-1 bg-[var(--background)]/90 backdrop-blur-lg rounded-xl border border-[var(--text-color)]/10 shadow-xl fixed z-50 transition-all animate-in fade-in zoom-in-95 duration-200 ease-out"
        >
            <Button type="bold" active={isBold} icon={Bold} onClick={() => format("bold")} />
            <Button type="italic" active={isItalic} icon={Italic} onClick={() => format("italic")} />
            <Button type="underline" active={isUnderline} icon={Underline} onClick={() => format("underline")} />
            <Button type="strikethrough" active={isStrikethrough} icon={Strikethrough} onClick={() => format("strikethrough")} />
            <Divider />
            <Button type="code" active={isCode} icon={Code} onClick={() => format("code")} />
        </div>,
        document.body
    );
}
