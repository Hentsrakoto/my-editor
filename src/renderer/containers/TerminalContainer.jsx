import React, { useCallback } from "react";
import TerminalView from "../components/terminal/TerminalView";
import useTerminal from "../hooks/useTerminal";

export default function TerminalContainer({ cwd }) {

  const runCommandHandler = useCallback(async (cmd) => {
    try {
      if (window?.api?.runCommand) {
        const result = await window.api.runCommand(cmd, cwd);
        return {
          success: result.success,
          output: (result.success ? result.stdout : (result.stderr || result.error)).split('\n')
        };
      }
      
      // Fallback if IPC is not available
      return {
        success: false,
        output: ["Error: window.api.runCommand is not available."]
      };

    } catch (err) {
      return {
        success: false,
        output: [`Terminal Error: ${err.message || err}`]
      };
    }
  }, [cwd]);

  const { lines, run, push, clear } = useTerminal({ runCommandHandler });

  return <TerminalView lines={lines} onRun={run} onClear={clear} cwd={cwd} />;
}