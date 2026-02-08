import React from 'react';
import { Node, RootNode, StyleNode, TextNode } from './parser/types';

export function renderAST(node: Node, key: string | number): React.ReactNode {
    if (node.type === 'ROOT') {
        const root = node as RootNode;
        return (
            <div key={key} className="prose dark:prose-invert max-w-none">
                {root.children.map((child, index) => renderAST(child, `root-${index}`))}
            </div>
        );
    }

    if (node.type === 'TEXT') {
        const text = node as TextNode;
        return <span key={key}>{text.value}</span>;
    }

    if (node.type === 'STYLE') {
        const styleNode = node as StyleNode;
        const children = styleNode.children.map((child, index) => renderAST(child, `${key}-${index}`));

        switch (styleNode.style) {
            case 'BOLD':
                return <strong key={key}>{children}</strong>;
            case 'ITALIC':
                return <em key={key}>{children}</em>;
            case 'CODE':
                return <code key={key} className="bg-gray-200 dark:bg-gray-700 rounded px-1">{children}</code>;
            case 'STRIKETHROUGH':
                return <s key={key}>{children}</s>;
            default:
                return <span key={key}>{children}</span>;
        }
    }

    if (node.type === 'MARKER') {
        const marker = node as import('./parser/types').MarkerNode;
        return <span key={key} className="text-gray-300 pointer-events-none select-none">{marker.value}</span>;
    }
}
