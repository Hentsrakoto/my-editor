import React from "react";

export default function TerminalLine({ line }) {
  // Commands are now rendered as part of the input line in TerminalView
  // All lines passed here are considered output.
  const className = line.type === 'error' 
    ? 'text-red-400'
    : 'text-gray-300';

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {line.text}
    </div>
  );
}