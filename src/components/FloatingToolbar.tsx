import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingToolbarProps {
    onFormat: (format: 'bold' | 'italic' | 'view') => void;
    containerRef: React.RefObject<HTMLElement | null>;
    isRawView: boolean;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ onFormat, containerRef, isRawView }) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const [visible, setVisible] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // IMPORTANT: Ignore clicks inside the toolbar itself
            if (toolbarRef.current?.contains(target)) {
                console.log("[FloatingToolbar] Clicked inside toolbar - ignoring mouseup");
                return; // Don't hide toolbar, let the button onClick handle it
            }

            // Check if we are interacting with the correct container/textarea
            if (!containerRef.current?.contains(target)) {
                setVisible(false);
                return;
            }

            // Specific handling for Textarea
            if (target instanceof HTMLTextAreaElement) {
                const { selectionStart, selectionEnd } = target;
                if (selectionStart !== selectionEnd) {
                    // Valid selection in textarea
                    // Position at mouse cursor (approximate end of selection)
                    setPosition({
                        top: e.clientY - 50,
                        left: e.clientX
                    });
                    setVisible(true);
                } else {
                    setVisible(false);
                }
            } else {
                // Fallback for non-textarea (if any)
                setVisible(false);
            }
        };

        const handleKeyUp = () => {
            // Hide on typing, show on Shift+Arrow? Complex without coordinates.
            // For now, let's just hiding on keypress ensures weird states don't happen.
            // Or we can check selection, but we lack coordinates.
            // Let's assume mouse-centric usage as requested.
            setVisible(false);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [containerRef]);

    if (!visible || !position) return null;

    // Portal to body to avoid clipping issues
    return createPortal(
        <div
            ref={toolbarRef}
            className="fixed z-50 flex items-center bg-gray-900 text-white rounded-lg shadow-xl px-2 py-1 transform -translate-x-1/2 transition-opacity duration-200"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()} // Prevent taking focus away from editor
        >
            <button
                onClick={() => {
                    console.log("[FloatingToolbar] Bold button clicked!");
                    onFormat('bold');
                }}
                className="p-2 hover:bg-gray-700 rounded transition-colors font-bold"
                title="Bold (Ctrl+B)"
            >
                B
            </button>
            <button
                onClick={() => onFormat('italic')}
                className="p-2 hover:bg-gray-700 rounded transition-colors italic"
                title="Italic (Ctrl+I)"
            >
                I
            </button>
            <div className="w-px h-4 bg-gray-600 mx-1"></div>
            <button
                onClick={() => onFormat('view')}
                className="p-2 hover:bg-gray-700 rounded transition-colors text-xs uppercase tracking-wider"
                title="Toggle Raw View"
            >
                {isRawView ? 'Preview' : 'Raw'}
            </button>
        </div>,
        document.body
    );
};

export default FloatingToolbar;
