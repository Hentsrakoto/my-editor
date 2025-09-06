import React, { useRef, useEffect, useState } from "react";
import TerminalLine from "./TerminalLine";
import { Play, Trash2 } from "lucide-react";

export default function TerminalView({ lines, onRun, onClear }) {
  const ref = useRef(null);
  const [input, setInput] = useState("");
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  const submit = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onRun(input);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200 font-mono">
      <div className="p-3 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <h3 className="font-medium">Terminal</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="p-1 rounded hover:bg-gray-700 transition-colors" title="Clear terminal"><Trash2 size={14}/></button>
        </div>
      </div>

      <div ref={ref} className="flex-1 overflow-y-auto p-3 space-y-1 text-sm" style={{ backgroundColor: '#1a1a1a' }}>
        {lines.map((l, i) => <TerminalLine key={i} line={l} />)}
      </div>

      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <form onSubmit={submit} className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-200"
            placeholder="Type a command..."
          />
          <button type="submit" className="p-1 rounded hover:bg-gray-700 transition-colors" title="Run command"><Play size={14}/></button>
        </form>
      </div>
    </div>
  );
}
