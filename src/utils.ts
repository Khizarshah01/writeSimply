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
