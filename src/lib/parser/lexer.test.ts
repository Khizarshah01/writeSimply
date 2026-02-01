import { describe, it, expect } from 'vitest';
import { Lexer } from './lexer';
import { TokenType } from './types';

describe('Lexer', () => {
    it('should recognize a single marker *', () => {
        const lexer = new Lexer("*");

        const token = lexer.nextToken();
        expect(token.type).toBe(TokenType.MARKER);
        expect(token.value).toBe("*");
    });


    it('should tokenize markers and text correctly', () => {
        const input = "*_~Hello~_*";
        const lexer = new Lexer(input);

        expect(lexer.nextToken()).toMatchObject({
            type: TokenType.MARKER,
            value: "*"
        });

        expect(lexer.nextToken()).toMatchObject({
            type: TokenType.MARKER,
            value: "_"
        });

        expect(lexer.nextToken()).toMatchObject({
            type: TokenType.MARKER,
            value: "~"
        });

        const textToken = lexer.nextToken();
        expect(textToken.type).toBe(TokenType.TEXT);
        expect(textToken.value).toBe("Hello");

        expect(lexer.nextToken()).toMatchObject({
            type: TokenType.MARKER,
            value: "~"
        });

        expect(lexer.nextToken()).toMatchObject({
            type: TokenType.MARKER,
            value: "_"
        });

        expect(lexer.nextToken()).toMatchObject({
            type: TokenType.MARKER,
            value: "*"
        });

        expect(lexer.nextToken().type).toBe(TokenType.EOF);
    });
});