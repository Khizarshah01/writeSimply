import { Token, TokenType } from "./types";

export class Lexer {
    private input: string;
    private position: number;

    constructor(input: string) {
        this.input = input;
        this.position = 0;
    }

    public nextToken(): Token {
        // 1. Check for End Of File
        if (this.position >= this.input.length) {
            return { type: TokenType.EOF, value: "", position: this.position };
        }

        const char = this.input[this.position];

        // 2. Check for Bold Marker '*'
        if (char === '*') {
            this.position++;
            return { type: TokenType.BOLD, value: "*", position: this.position - 1 };
        }

        // Check for Italic Marker '_'
        if (char === '_') {
            this.position++;
            return { type: TokenType.ITALIC, value: "_", position: this.position - 1 };
        }

        // Check for Code Marker '`'
        if (char === '`') {
            this.position++;
            return { type: TokenType.CODE, value: "`", position: this.position - 1 };
        }

        // 3. TODO: Check for Text
        // Hint: Loop until you hit a special char
        let textValue = "";

        while (this.position < this.input.length) {
            const currentChar = this.input[this.position];
            if (currentChar === '*' || currentChar === '_' || currentChar === '`') {
                break; // Stop if we hit a marker
            }
            textValue += currentChar;
            this.position++;
        }

        return { type: TokenType.TEXT, value: textValue, position: this.position - textValue.length };
    }
}
