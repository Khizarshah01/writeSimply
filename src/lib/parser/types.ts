export enum TokenType {
  TEXT = 'TEXT',
  BOLD = 'BOLD',   // *
  ITALIC = 'ITALIC', // _
  CODE = 'CODE',   // `
  EOF = 'EOF'      // End of Input
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}
