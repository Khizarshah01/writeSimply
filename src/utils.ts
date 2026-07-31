/** Resolve a font setting ("Serif", "Monospace", or a raw family) to a full CSS font stack. */
export function fontStack(font: string): string {
  switch (font.toLowerCase()) {
    case "serif":
      return "var(--font-serif)";
    case "monospace":
    case "ubuntu mono":
    case "courier new":
      return "var(--font-mono)";
    default:
      return `"${font}", var(--font-serif)`;
  }
}

export function getNextUntitledName(files: string[]): string {
  const untitledPattern = /^untitled(?:\((\d+)\))?$/;
  const untitledNumbers = new Set<number>();
  files.forEach((file) => {
    const match = file.match(untitledPattern);
    if (match) {
      const num = match[1] ? parseInt(match[1], 10) : 0;
      untitledNumbers.add(num);
    }
  });

  let nextNumber = 0;
  while (untitledNumbers.has(nextNumber)) {
    nextNumber++;
  }

  return nextNumber === 0 ? "untitled" : `untitled(${nextNumber})`;
}
