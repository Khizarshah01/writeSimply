import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
    $getRoot,
    KEY_DOWN_COMMAND,
    COMMAND_PRIORITY_LOW,
    $getSelection,
    $isRangeSelection,
    $createRangeSelection,
    $setSelection,
} from "lexical";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import {
    $convertToMarkdownString,
    $convertFromMarkdownString,
    CHECK_LIST,
    ELEMENT_TRANSFORMERS,
    TEXT_FORMAT_TRANSFORMERS,
    LINK,
} from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { fontStack } from "../utils";

// Documents are serialized as Markdown, so formatting survives save/load
// and exported files are portable plain text.
const TRANSFORMERS = [CHECK_LIST, ...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, LINK];

const theme = {
    text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        code: "inline-code",
        strikethrough: "line-through",
    },
    heading: {
        h1: "editor-h1",
        h2: "editor-h2",
        h3: "editor-h3",
    },
    quote: "editor-quote",
    code: "editor-codeblock",
    link: "editor-link",
    list: {
        listitem: "editor-listitem",
        listitemChecked: "editor-listitem-checked",
        listitemUnchecked: "editor-listitem-unchecked",
        checklist: "editor-checklist",
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
                onContentChange?.($convertToMarkdownString(TRANSFORMERS));
            });
        });
    }, [editor, onContentChange]);
    return null;
}

function UpdateContentPlugin({ content }: { content?: string }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if (content === undefined) return;

        const current = editor.getEditorState().read(() => $convertToMarkdownString(TRANSFORMERS));
        if (current === content) return;

        editor.update(() => {
            $convertFromMarkdownString(content, TRANSFORMERS);
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
                const { key, shiftKey, ctrlKey, metaKey } = event;
                const isMod = ctrlKey || metaKey;

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

                // Keyboard shortcuts to jump to start/end of document (for long text)
                if (isMod && (key === 'Home' || key === 'End')) {
                    event.preventDefault();

                    editor.update(() => {
                        const root = $getRoot();
                        const selection = $createRangeSelection();

                        if (key === 'End') {
                            // Go to the very end of the document
                            selection.anchor.set(root.getKey(), root.getChildrenSize(), 'element');
                            selection.focus.set(root.getKey(), root.getChildrenSize(), 'element');
                        } else {
                            // Go to the very start of the document
                            selection.anchor.set(root.getKey(), 0, 'element');
                            selection.focus.set(root.getKey(), 0, 'element');
                        }

                        $setSelection(selection);
                    });

                    // Scroll the editor to the target position
                    setTimeout(() => {
                        const rootEl = editor.getRootElement();
                        if (rootEl) {
                            if (key === 'End') {
                                rootEl.scrollTop = rootEl.scrollHeight;
                            } else {
                                rootEl.scrollTop = 0;
                            }
                        }
                    }, 0);

                    return true;
                }

                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);
    return null;
}

// Typewriter mode: keeps the active line vertically centered and dims the rest.
// Activates automatically whenever the app is in `.focus-mode`.
function TypewriterPlugin() {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        const clearActive = () => {
            const root = editor.getRootElement();
            root?.querySelectorAll(".active-line").forEach((el) =>
                el.classList.remove("active-line")
            );
        };

        const apply = () => {
            const root = editor.getRootElement();
            if (!root) return;
            editor.getEditorState().read(() => {
                clearActive();
                const selection = $getSelection();
                if (
                    !document.querySelector(".focus-mode") ||
                    !$isRangeSelection(selection)
                )
                    return;

                const topEl = selection.anchor.getNode().getTopLevelElement();
                if (!topEl) return;
                const dom = editor.getElementByKey(topEl.getKey());
                if (!dom) return;

                dom.classList.add("active-line");

                // Center the active line inside the editor viewport.
                const rootRect = root.getBoundingClientRect();
                const domRect = dom.getBoundingClientRect();
                const delta =
                    domRect.top +
                    domRect.height / 2 -
                    (rootRect.top + rootRect.height / 2);
                if (Math.abs(delta) > 1) root.scrollTop += delta;
            });
        };

        const unregister = editor.registerUpdateListener(() => apply());

        // Re-run when focus mode is toggled on/off.
        const observer = new MutationObserver(() => apply());
        const container = document.querySelector(".app-container");
        if (container)
            observer.observe(container, {
                attributes: true,
                attributeFilter: ["class"],
            });

        return () => {
            unregister();
            observer.disconnect();
            clearActive();
        };
    }, [editor]);
    return null;
}

export default function LexicalEditor({ font, fontSize, content, onContentChange }: EditorProps) {
    const initialConfig = {
        namespace: "MyEditor",
        theme,
        nodes: [ListNode, ListItemNode, HeadingNode, QuoteNode, CodeNode, LinkNode],
        onError: (e: Error) => console.error(e)
    };

    // No placeholder text for a pure, clean starting canvas
    const placeholder = "";

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="flex-1 flex justify-center items-start px-4 overflow-hidden relative group/editor">
                <div
                    className="transition-all duration-300 h-full w-full max-w-[760px] relative editor-surface"
                    style={{
                        background: "var(--background)",
                        fontFamily: fontStack(font),
                        fontSize: `${fontSize}px`
                    }}
                >
                    <ToolbarPlugin />
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="w-full h-full p-8 resize-none border-none outline-none bg-transparent absolute inset-0 z-10 scrollbar-hide focus:outline-none overflow-y-auto"
                                style={{
                                    fontFamily: fontStack(font),
                                    fontSize: `${fontSize}px`,
                                    lineHeight: "1.7",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    color: "var(--text-color)",
                                    caretColor: "inherit"
                                }}
                            />
                        }
                        placeholder={
                            <div
                                className="w-full h-full p-8 absolute inset-0 pointer-events-none select-none overflow-hidden"
                                style={{
                                    fontFamily: fontStack(font),
                                    fontSize: `${fontSize}px`,
                                    lineHeight: "1.7",
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
                    <ListPlugin />
                    <CheckListPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <ParentSyncPlugin onContentChange={onContentChange} />
                    <UpdateContentPlugin content={content} />
                    <EditorKeysPlugin />
                    <TypewriterPlugin />
                </div>
            </div>
        </LexicalComposer>
    );
}
