import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState, useCallback } from "react";
import {
    $getRoot,
    $createParagraphNode,
    $createTextNode,
    KEY_DOWN_COMMAND,
    COMMAND_PRIORITY_LOW,
    $getSelection,
    $isRangeSelection
} from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import quotes from "../assets/motivationalQuotes.json";
import ToolbarPlugin from "./plugins/ToolbarPlugin";

const theme = {
    text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        code: "font-mono bg-gray-200 rounded px-1",
        strikethrough: "line-through",
    },
};

interface EditorProps {
    font: string;
    fontSize: number;
    content?: string;
    onContentChange?: (content: string) => void;
}

function ParentSyncPlugin({ onContentChange }: { onContentChange?: (content: string) => void }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const text = $getRoot().getTextContent();
                onContentChange?.(text);
            });
        });
    }, [editor, onContentChange]);
    return null;
}

function UpdateContentPlugin({ content }: { content?: string }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if (content === undefined) return;

        editor.update(() => {
            const root = $getRoot();
            const currentText = root.getTextContent();

            if (currentText !== content) {
                root.clear();
                const p = $createParagraphNode();
                p.append($createTextNode(content));
                root.append(p);
            }
        });
    }, [editor, content]);
    return null;
}

function EditorKeysPlugin() {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return editor.registerCommand(
            KEY_DOWN_COMMAND,
            (event: KeyboardEvent) => {
                const { key, shiftKey } = event;

                if (key === 'Tab' && !shiftKey) {
                    event.preventDefault();
                    editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            selection.insertText('  ');
                        }
                    });
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);
    return null;
}

export default function LexicalEditor({ font, fontSize, content, onContentChange }: EditorProps) {
    const initialConfig = {
        namespace: "MyEditor",
        theme,
        onError: (e: Error) => console.error(e)
    };

    const [placeholder, setPlaceholder] = useState<string>("");

    const getRandomQuote = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
    }, []);

    useEffect(() => {
        setPlaceholder(getRandomQuote());
    }, [getRandomQuote]);

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="flex-1 flex justify-center items-start px-4 overflow-hidden relative group/editor">
                <div
                    className="transition-all duration-300 h-full w-full max-w-4xl relative h-full"
                    style={{
                        background: "var(--background)",
                        fontFamily: font,
                        fontSize: `${fontSize}px`
                    }}
                >
                    <ToolbarPlugin />
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="w-full h-full p-8 leading-relaxed resize-none border-none outline-none bg-transparent absolute inset-0 z-10 scrollbar-hide focus:outline-none"
                                style={{
                                    fontFamily: font,
                                    fontSize: `${fontSize}px`,
                                    lineHeight: "1.6",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    color: "var(--text-color)",
                                    caretColor: "inherit"
                                }}
                            />
                        }
                        placeholder={
                            <div
                                className="w-full h-full p-8 leading-relaxed absolute inset-0 pointer-events-none text-gray-400 select-none overflow-hidden"
                                style={{
                                    fontFamily: font,
                                    fontSize: `${fontSize}px`,
                                    lineHeight: "1.6",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    color: "rgba(156, 163, 175, 0.5)"
                                }}
                            >
                                {placeholder}
                            </div>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ParentSyncPlugin onContentChange={onContentChange} />
                    <UpdateContentPlugin content={content} />
                    <EditorKeysPlugin />
                </div>
            </div>
        </LexicalComposer>
    );
}
