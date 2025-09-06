import React from "react";

export default function EditorStatusBar({ line = 1, column = 1, length = 0 }) {
  return (
    <div className="flex items-center justify-between px-3 py-1 text-xs bg-gray-900 border-t border-gray-800">
      <div>Chars: {length}</div>
      <div>Ln {line}, Col {column}</div>
    </div>
  );
}
