import { useCallback, useState } from "react";

export default function useTerminal({ runCommandHandler } = {}) {
  const [lines, setLines] = useState([
    { type: "output", text: "Terminal ready - type commands to interact with your project" },
  ]);

  const push = useCallback((line) => {
    setLines(prev => [...prev, { ...line }]);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const run = useCallback(async (cmd) => {
    if (!cmd || !cmd.trim()) return;

    // Add the command to the history
    push({ type: "command", text: `$ ${cmd}` });

    try {
      if (runCommandHandler) {
        const result = await runCommandHandler(cmd);
        
        // The handler now returns an object { success, output }
        // where output is an array of strings.
        const lineType = result.success ? "output" : "error";
        
        result.output.forEach(lineText => {
          if (lineText) { // Don't push empty lines
            push({ type: lineType, text: lineText });
          }
        });

      } else {
        // Fallback simulation for when IPC is not available
        push({ type: "error", text: `No command handler available to run: ${cmd}` });
      }
    } catch (err) {
      push({ type: "error", text: `Error: ${err.message || err}` });
    }
  }, [push, runCommandHandler, clear]);

  return {
    lines,
    run,
    push,
    clear,
  };
}