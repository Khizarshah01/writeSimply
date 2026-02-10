import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { RootNode as CustomRootNode, Node as CustomNode, StyleNode, TextNode } from "./parser/types";

export function $convertASTToLexical(ast: CustomRootNode) {
    const root = $getRoot();
    root.clear();

    const paragraph = $createParagraphNode();

    // Helper to traverse
    function traverse(nodes: CustomNode[], format: number) {
        nodes.forEach(node => {
            if (node.type === 'TEXT') {
                const textNode = node as TextNode;
                const lexicalText = $createTextNode(textNode.value);
                lexicalText.setFormat(format);
                paragraph.append(lexicalText);
            }
            else if (node.type === 'MARKER') {
                const markerNode = node as import("../lib/parser/types").MarkerNode;
                const lexicalText = $createTextNode(markerNode.value);
                // Markers usually don't have the format of the content they wrap (they are outside)
                paragraph.append(lexicalText);
            }
            else if (node.type === 'STYLE') {
                const styleNode = node as StyleNode;
                let newFormat = format;

                if (styleNode.style === 'BOLD') newFormat |= 1;
                if (styleNode.style === 'ITALIC') newFormat |= 2;
                if (styleNode.style === 'STRIKETHROUGH') newFormat |= 4;
                if (styleNode.style === 'CODE') newFormat |= 16;

                traverse(styleNode.children, newFormat);
            }
        });
    }

    traverse(ast.children, 0);
    root.append(paragraph);
}
