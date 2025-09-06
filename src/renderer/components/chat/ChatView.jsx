// src/components/chat/ChatView.jsx
import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatView({ messages, loading, onSend, onAttachFile }) {
  const endRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  // parent (ChatContainer) peut fournir un onAttachFile pour lecture via API/Electron
  const handleAttach = async (fileOrPath) => {
    // if parent provided handler, let it manage creation & validation
    if (onAttachFile) {
      const f = await onAttachFile(fileOrPath);
      if (f) setAttachedFiles(prev => [...prev, f]);
      return;
    }

    // otherwise if file-like object (native File), append it
    if (fileOrPath instanceof File) {
      setAttachedFiles(prev => [...prev, fileOrPath]);
      return;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    // 1) custom path from FolderNode
    const path = e.dataTransfer.getData("application/x-myapp-file");
    if (path) {
      handleAttach(path);
      return;
    }
    // 2) native files dragged from OS
    const dtFiles = Array.from(e.dataTransfer.files || []);
    for (const f of dtFiles) handleAttach(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary to allow drop
  };

  const handleRemoveAttachment = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = (text) => {
    // call parent onSend with text and attachedFiles
    onSend(text, attachedFiles);
    setAttachedFiles([]); // clear after send
  };

  return (
    <div className="h-full flex flex-col bg-gray-900" onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${loading ? "bg-yellow-400" : "bg-green-400"}`}></div>
          <h3 className="font-medium text-gray-200">Assistant IA</h3>
        </div>
        <p className="text-xs text-gray-500">{loading ? "En train d'écrire..." : "Connecté et prêt à vous aider"}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map(m => <ChatMessage key={m.id} message={m} />)}
        <div ref={endRef} />
      </div>

      {/* attachments preview */}
      {attachedFiles.length > 0 && (
        <div className="p-2 border-t border-gray-700 bg-gray-800 flex gap-2 items-center">
          {attachedFiles.map((f, i) => (
            <div key={`${f.name}-${i}`} className="bg-gray-700 px-2 py-1 rounded flex items-center gap-2 text-xs">
              <span className="truncate max-w-xs">{f.name}</span>
              <button onClick={() => handleRemoveAttachment(i)} className="text-red-400 ml-2">✕</button>
            </div>
          ))}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
