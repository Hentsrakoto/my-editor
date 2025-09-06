import React, { useState, useRef, useEffect } from 'react';
import { Play, Trash2 } from 'lucide-react';

const TerminalComponent = () => {
  const [commands, setCommands] = useState([
    { type: 'output', text: 'Terminal ready - type commands to interact with your project' },
    { type: 'output', text: 'System: Electron React Code Editor v1.0.0' }
  ]);
  const [input, setInput] = useState('');
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Ajouter la commande à l'historique
    setCommands(prev => [...prev, { type: 'command', text: `$ ${input}` }]);

    // Traiter la commande
    processCommand(input);

    // Effacer l'input
    setInput('');
  };

  const processCommand = (cmd) => {
    const command = cmd.toLowerCase().trim();
    let response;

    switch (command) {
      case 'help':
        response = [
          'Available commands:',
          '  help - Show this help message',
          '  clear - Clear terminal screen',
          '  status - Show project status',
          '  ls - List files in current directory',
          '  version - Show application version'
        ];
        break;
      case 'clear':
        setCommands([]);
        return;
      case 'status':
        response = ['Project status: OK', 'No errors detected', 'All systems operational'];
        break;
      case 'ls':
        response = [
          'src/',
          '  components/',
          '  utils/',
          '  styles/',
          'package.json',
          'README.md',
          'main.js'
        ];
        break;
      case 'version':
        response = ['Electron React Code Editor v1.0.0', 'Node.js: ' + process.versions.node];
        break;
      default:
        response = [`Command not found: ${cmd}`, 'Type "help" for available commands'];
    }

    if (Array.isArray(response)) {
      response.forEach(line => {
        setCommands(prev => [...prev, { type: 'output', text: line }]);
      });
    } else {
      setCommands(prev => [...prev, { type: 'output', text: response }]);
    }
  };

  const clearTerminal = () => {
    setCommands([]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200 font-mono">
      {/* En-tête du terminal */}
      <div className="p-3 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <h3 className="font-medium">Terminal</h3>
        </div>
        <button
          onClick={clearTerminal}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
          title="Clear terminal"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Sortie du terminal */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 text-sm"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {commands.map((cmd, index) => (
          <div
            key={index}
            className={cmd.type === 'command' ? 'text-green-400' : 'text-gray-300'}
          >
            {cmd.text}
          </div>
        ))}
      </div>

      {/* Input du terminal */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-200"
            placeholder="Type a command..."
          />
          <button
            type="submit"
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Run command"
          >
            <Play size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TerminalComponent;