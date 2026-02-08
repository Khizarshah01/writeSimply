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

export type NodeType = 'ROOT' | 'TEXT' | 'STYLE' | 'MARKER';
export type StyleType = 'BOLD' | 'ITALIC' | 'CODE' | 'STRIKETHROUGH';

export interface Node {
  type: NodeType;
}

export interface RootNode extends Node {
  type: 'ROOT';
  children: Node[];
}

export interface TextNode extends Node {
  type: 'TEXT';
  value: string;
}

export interface MarkerNode extends Node {
  type: 'MARKER';
  value: string;
}

export interface StyleNode extends Node {
  type: 'STYLE';
  style: StyleType;
  marker: string;  // Store the actual marker used (*, **, etc)
  children: Node[];
}
