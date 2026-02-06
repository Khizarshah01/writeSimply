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
        // Lexer produces: MARKER(**), TEXT(Bold), MARKER(**)
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        expect(ast.children).toHaveLength(1);
        const boldNode = ast.children[0] as StyleNode;
        expect(boldNode.type).toBe('STYLE');
        expect(boldNode.style).toBe('BOLD');
        expect(boldNode.children).toHaveLength(1);
        expect((boldNode.children[0] as TextNode).value).toBe('Bold');
    });

    it('should parse nested styles', () => {
        const input = "**Bold *Italic***";
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        const boldNode = ast.children[0] as StyleNode;
        expect(boldNode.style).toBe('BOLD');


        // Wait, "Bold *Italic*" -> Text("Bold "), Marker(*), Text("Italic"), Marker(*).
        // Check children of Bold:
        // 1. TextNode "Bold "
        // 2. StyleNode (Italic)

        expect(boldNode.children).toHaveLength(2);
        expect((boldNode.children[0] as TextNode).value).toBe('Bold ');
        expect((boldNode.children[1] as StyleNode).style).toBe('ITALIC');
    });
});
