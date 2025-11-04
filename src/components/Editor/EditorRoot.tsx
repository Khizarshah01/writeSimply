import React, { useState } from "react";
import MarkdownEditor from "./MarkdownEditor";
import Toolbar from "./Toolbar";

function EditorRoot() {
  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState("light");
  const [content, setContent] = useState("");
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="flex-1 flex justify-center items-center px-4 overflow-hidden">
      <MarkdownEditor
        font={font}
        fontSize={fontSize}
        theme={theme}
        content={content}
        onContentChange={setContent}
        onTextSelect={(pos) => setToolbarPos(pos)} // 👈 custom event
      />
      {toolbarPos && <Toolbar position={toolbarPos} onClose={() => setToolbarPos(null)} />}
    </div>
  );
}

export default EditorRoot;
