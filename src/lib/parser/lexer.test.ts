import { describe, it, expect } from 'vitest';
import { Lexer } from './lexer';
import { TokenType } from './types';

describe('Lexer', () => {
    it('should recognize just a bold marker', () => {
        const input = "*";
        const lexer = new Lexer(input);

        // Should get a BOLD token
        const token = lexer.nextToken();
        expect(token.type).toBe(TokenType.BOLD);
        expect(token.value).toBe("*");
    });

    it('should recognize nested bold italic *_Hello_*', () => {
        const input = "*_Hello_*";
        const lexer = new Lexer(input);

        expect(lexer.nextToken().type).toBe(TokenType.BOLD);   // *
        expect(lexer.nextToken().type).toBe(TokenType.ITALIC); // _

        const textToken = lexer.nextToken();
        expect(textToken.type).toBe(TokenType.TEXT);           // Hello
        expect(textToken.value).toBe("Hello");

        expect(lexer.nextToken().type).toBe(TokenType.ITALIC); // _
        expect(lexer.nextToken().type).toBe(TokenType.BOLD);   // *
    });
});