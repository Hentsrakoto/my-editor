import React, { useRef, useEffect, useState } from "react";
import TerminalLine from "./TerminalLine";
import { Trash2 } from "lucide-react";

export default function TerminalView({ lines, onRun, onClear, cwd }) {
  const [input, setInput] = useState("");
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, input]);

  // Focus input on mount and on any click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!input.trim()) return;
      onRun(input);
      setInput("");
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Get the last part of the path for the prompt
  const promptPath = cwd ? `~/${cwd.split(/\\|/).pop()}` : "~";

  return (
    <div className="h-full flex flex-col bg-black text-gray-200 font-mono" onClick={focusInput}>
      {/* Header */}
      <div className="p-2 border-b border-gray-800 bg-gray-900 flex justify-between items-center shrink-0">
        <h3 className="font-medium text-sm">Terminal</h3>
        <button onClick={onClear} className="p-1 rounded hover:bg-gray-700 transition-colors" title="Clear terminal">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-y-auto p-3 text-sm space-y-1">
        {lines.map((l, i) => <TerminalLine key={i} line={l} />)}
        
        {/* Input Line */}
        <div className="flex">
          <span className="text-blue-400 mr-2">{promptPath}</span>
          <span className="text-green-400 mr-2">$</span>
          <span className="flex-1 whitespace-pre">{input}</span>
          <span className="blinking-cursor bg-gray-200 w-2 h-4"></span>
        </div>

        <div ref={terminalEndRef} />
      </div>

      {/* Hidden actual input field */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 -left-full"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    </div>
  );
}