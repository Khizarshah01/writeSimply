export enum TokenType {
  TEXT = 'TEXT',
  MARKER = 'MARKER', // *, **, _, __, `, ~~
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// so i can remove the position from the token currently there is now sense to store this but i research it. and it usefull in some cases let see..
