import { Token, TokenType, RootNode, TextNode, StyleNode } from "./types";
import { Lexer } from "./lexer";

export class Parser {
    private lexer: Lexer;
    private currentToken: Token;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.nextToken();
    }

    public parse(): RootNode {
        const root: RootNode = {
            type: 'ROOT',
            children: []
        };

        const stack: (RootNode | StyleNode)[] = [root];

        while (this.currentToken.type !== TokenType.EOF) {
            const currentHead = stack[stack.length - 1];

            if (this.currentToken.type === TokenType.TEXT) {
                // If it's text, just append it to the current open node
                const textNode: TextNode = {
                    type: 'TEXT',
                    value: this.currentToken.value
                };
                currentHead.children.push(textNode);
                this.eat(TokenType.TEXT);
            }
            else if (this.currentToken.type === TokenType.MARKER) {
                this.handleMarker(stack);
            }
            else {
                // Safety mechanism to avoid infinite loops if unknown token
                this.eat(this.currentToken.type);
            }
        }

        return root;
    }

    private handleMarker(stack: (RootNode | StyleNode)[]): void {
        const marker = this.currentToken.value;
        const currentHead = stack[stack.length - 1];

        // Prepare marker node
        const markerNode: import("./types").MarkerNode = {
            type: 'MARKER',
            value: marker
        };

        // 1. Check if Closing
        // Use 'marker' property if available (for precise matching like * vs _), else fallback or strict match
        // Since we re-added 'marker' property to StyleNode, we should use it.
        const headAsStyle = currentHead as StyleNode;
        if (currentHead.type === 'STYLE' && (headAsStyle.marker === marker || this.getMarkerForStyle(currentHead.style) === marker)) {
            stack.pop();
            // Add closing marker to the *parent* node (the new head after popping)
            const parent = stack[stack.length - 1];
            parent.children.push(markerNode);
            this.eat(TokenType.MARKER);
            return;
        }

        const styleType = this.getStyleForMarker(marker);
        if (styleType) {
            // Add opening marker to current parent
            currentHead.children.push(markerNode);

            const newStyleNode: StyleNode = {
                type: 'STYLE',
                style: styleType,
                marker: marker,
                children: []
            };

            // Add to current parent
            currentHead.children.push(newStyleNode);

            // Push to stack (so future text goes inside this)
            stack.push(newStyleNode);
            this.eat(TokenType.MARKER);
        } else {
            // Treat unknown marker as simple text
            const textNode: TextNode = {
                type: 'TEXT',
                value: marker
            };
            currentHead.children.push(textNode);
            this.eat(TokenType.MARKER);
        }
    }

    private getStyleForMarker(marker: string): import("./types").StyleType | null {
        switch (marker) {
            case '*': return 'ITALIC';
            case '**': return 'BOLD';
            case '_': return 'ITALIC';
            case '__': return 'BOLD';
            case '`': return 'CODE';
            case '~~': return 'STRIKETHROUGH';
            default: return null;
        }
    }

    private getMarkerForStyle(style: import("./types").StyleType): string {
        switch (style) {
            case 'BOLD': return '**';
            case 'ITALIC': return '*'; // Defaulting to * for now. TODO: Handle _ correctly by storing it.
            case 'CODE': return '`';
            case 'STRIKETHROUGH': return '~~';
            default: return '';
        }
    }

    /**
     * Helper: Eat the current token and move to next
     */
    private eat(expectedType: TokenType): void {
        if (this.currentToken.type === expectedType) {
            this.currentToken = this.lexer.nextToken();
        } else {
            console.error(`Expected ${expectedType} but got ${this.currentToken.type}`);
        }
    }
}
