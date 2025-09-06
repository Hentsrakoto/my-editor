import React, { useCallback } from "react";
import TerminalView from "../components/terminal/TerminalView";
import useTerminal from "../hooks/useTerminal";

export default function TerminalContainer() {

  const runCommandHandler = useCallback(async (cmd) => {
    // Electron IPC pattern recommended:
    if (window?.api?.runCommand) {
      // returns array or string
      return await window.api.runCommand(cmd);
    }
    // Fallback: simulate or call backend endpoint
    // Example: call /api/terminal (server executes safe script) -> must be sandboxed!
    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd })
      });
      const data = await res.json();
      return data?.output || [`Command executed: ${cmd}`];
    } catch (err) {
      // fallback simulation handled by useTerminal
      console.warn("TerminalContainer runCommandHandler fallback", err);
      throw err;
    }
  }, []);

  const { lines, run, push, clear } = useTerminal({ runCommandHandler });

  return <TerminalView lines={lines} onRun={run} onClear={clear} />;
}
