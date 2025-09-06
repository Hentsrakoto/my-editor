import { useCallback, useRef, useState } from "react";

/**
 * useTerminal
 * - commands: [{ type: 'output'|'command', text }]
 * - runCommand: abstraction exécutant la commande (IPC / backend / simulation)
 */
export default function useTerminal({ runCommandHandler } = {}) {
  const [lines, setLines] = useState([
    { type: "output", text: "Terminal ready - type commands to interact with your project" },
    { type: "output", text: "System: Electron React Code Editor v1.0.0" }
  ]);
  const idRef = useRef(0);

  const push = useCallback((line) => {
    setLines(prev => [...prev, { ...line }]);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const run = useCallback(async (cmd) => {
    if (!cmd || !cmd.trim()) return;
    push({ type: "command", text: `$ ${cmd}` });
    try {
      if (runCommandHandler) {
        // handler returns array of lines or single string
        const res = await runCommandHandler(cmd);
        if (Array.isArray(res)) res.forEach(l => push({ type: "output", text: l }));
        else push({ type: "output", text: String(res) });
      } else {
        // fallback simulated responses
        const lower = cmd.trim().toLowerCase();
        let resp;
        switch (lower) {
          case "help":
            resp = [
              "Available commands:",
              "  help - Show this help message",
              "  clear - Clear terminal screen",
              "  status - Show project status",
              "  ls - List files in current directory",
              "  version - Show application version"
            ];
            break;
          case "clear":
            clear();
            return;
          case "status":
            resp = ['Project status: OK', 'No errors detected', 'All systems operational'];
            break;
          case "ls":
            resp = [
              'src/',
              '  components/',
              '  utils/',
              '  styles/',
              'package.json',
              'README.md',
              'main.js'
            ];
            break;
          case "version":
            resp = ['Electron React Code Editor v1.0.0', `Node.js: ${process?.versions?.node || 'unknown'}`];
            break;
          default:
            resp = [`Command not found: ${cmd}`, 'Type "help" for available commands'];
        }
        resp.forEach(line => push({ type: "output", text: line }));
      }
    } catch (err) {
      push({ type: "output", text: `Error running command: ${err.message || err}` });
    }
  }, [push, runCommandHandler, clear]);

  return {
    lines,
    run,
    push,
    clear,
  };
}
