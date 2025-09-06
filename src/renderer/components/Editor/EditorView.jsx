import React from "react";
import Editor from "@monaco-editor/react";

export default function EditorView({
  language,
  content,
  fontSize,
  onChange,
  onMount,    // receives (editor, monaco)
  options = {}
}) {
  return (
    <div className="flex-1 relative">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={onChange}
        onMount={onMount}
        theme="vs-dark"
        options={{
          fontSize,
          minimap: { enabled: true },
          automaticLayout: true,
          wordWrap: "on",
          smoothScrolling: true,
          cursorBlinking: "phase",
          matchBrackets: "always",
          autoClosingBrackets: "always",
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          scrollBeyondLastLine: false,
          rulers: [80, 120],
          lineNumbersMinChars: 3,
          folding: true,
          showFoldingControls: "mouseover",
          parameterHints: { enabled: true },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          ...options
        }}
      />
    </div>
  );
}
