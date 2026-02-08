import { describe, it, expect } from 'vitest';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { TextNode, StyleNode } from './types';

describe('Parser', () => {
    it('should parse simple text', () => {
        const input = "Hello World";
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        expect(ast.type).toBe('ROOT');
        expect(ast.children).toHaveLength(1);
        expect((ast.children[0] as TextNode).type).toBe('TEXT');
        expect((ast.children[0] as TextNode).value).toBe('Hello World');
    });

    it('should parse bold text', () => {
        const input = "**Bold**";
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        // New structure: Marker(**), Style(Bold), Marker(**)
        expect(ast.children).toHaveLength(3);

        expect(ast.children[0].type).toBe('MARKER');
        expect((ast.children[0] as any).value).toBe('**');

        const boldNode = ast.children[1] as StyleNode;
        expect(boldNode.type).toBe('STYLE');
        expect(boldNode.style).toBe('BOLD');
        expect(boldNode.children).toHaveLength(1);
        expect((boldNode.children[0] as TextNode).value).toBe('Bold');

        expect(ast.children[2].type).toBe('MARKER');
        expect((ast.children[2] as any).value).toBe('**');
    });

    it('should parse nested styles', () => {
        const input = "**Bold _Italic_**";
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        // 1. Marker(**)
        // 2. Style(Bold)
        // 3. Marker(**)
        expect(ast.children).toHaveLength(3);
        const boldNode = ast.children[1] as StyleNode;
        expect(boldNode.style).toBe('BOLD');

        // Bold children:
        // 1. Text("Bold ")
        // 2. Marker(_)
        // 3. Style(Italic)
        // 4. Marker(_)
        expect(boldNode.children).toHaveLength(4);
        expect((boldNode.children[0] as TextNode).value).toBe('Bold ');

        expect(boldNode.children[1].type).toBe('MARKER');
        expect((boldNode.children[1] as any).value).toBe('_');

        const italicNode = boldNode.children[2] as StyleNode;
        expect(italicNode.style).toBe('ITALIC');
        expect((italicNode.children[0] as TextNode).value).toBe('Italic');

        expect(boldNode.children[3].type).toBe('MARKER');
        expect((boldNode.children[3] as any).value).toBe('_');
    });
});
