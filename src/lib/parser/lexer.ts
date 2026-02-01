import { Token, TokenType } from "./types";

const MARKERS = new Set(['*', '_', '`', '~']);

export class Lexer {
    private position = 0;

    constructor(private input: string) { }

    public nextToken(): Token {
        // EOF
        if (this.position >= this.input.length) {
            return { type: TokenType.EOF, value: "", position: this.position };
        }

        const char = this.input[this.position];

        // check multi character marker (~~, **, __)
        if (MARKERS.has(char) && this.peek() === char) {
            const start = this.position;
            this.position += 2;
            return {
                type: TokenType.MARKER,
                value: char + char,
                position: start
            };
        }

        // check single character marker (*, _, `)
        if (MARKERS.has(char)) {
            const start = this.position;
            this.position++;
            return {
                type: TokenType.MARKER,
                value: char,
                position: start
            };
        }

        // Text
        const start = this.position;
        while (
            this.position < this.input.length &&
            !MARKERS.has(this.input[this.position])
        ) {
            this.position++;
        }

        return {
            type: TokenType.TEXT,
            value: this.input.slice(start, this.position),
            position: start
        };
    }

    private peek(offset = 1): string {
        return this.input[this.position + offset];
    }
}
