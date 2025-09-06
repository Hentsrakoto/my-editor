// src/renderer/ChatContainer.jsx
import React, { useState, useCallback, useRef } from "react";
import ChatView from "../components/chat/ChatView";
import useChat from "../hooks/useChat";
import useChatApi from "../hooks/useChatApi";

export default function ChatContainer({ contextFiles }) {
  const { sendToApi } = useChatApi();

  const { messages, loading, sendMessage } = useChat({
    initialMessages: [{
      id: 1,
      text: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }],
    sendToApi
  });

  // handler appelé par ChatView quand on drop un chemin ou on drag native File
  const handleAttachFile = async (fileOrPath) => {
    // Si c'est déjà un File (drag from OS), renvoie-le tel quel
    if (fileOrPath instanceof File) return fileOrPath;

    // Sinon on reçoit un chemin (string) depuis FolderNode
    const fullPath = fileOrPath;
    try {
      // 1) Electron path (main process exposes readFile)
      if (window?.api?.readFile) {
        // readFile should return { name, content } or raw text
        const resp = await window.api.readFile(fullPath);
        // resp may be { name, content } or string
        const name = resp?.name ?? fullPath.split("/").pop();
        const content = resp?.content ?? resp;
        return new File([content], name, { type: "text/plain" });
      }

      // 2) Fallback HTTP endpoint: POST /api/fs/read { path }
      const r = await fetch("/api/fs/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath })
      });
      if (!r.ok) throw new Error("cannot read file from server");
      const data = await r.json(); // { name, content }
      return new File([data.content], data.name, { type: "text/plain" });
    } catch (err) {
      console.error("attach file failed", err);
      return null;
    }
  };

  // wrapper onSend receives text and files (File[])
  const handleSend = async (text, files = []) => {
    // files are File objects (or converted ones)
    // call useChat.sendMessage with text and files
    return sendMessage(text, files);
  };

  // --- Drag visual effect (no layout change) ---
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // increment counter because dragenter can fire for child elements too
    dragCounter.current += 1;
    // only show for file drags
    const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
    if (types.includes && (types.includes("Files") || types.includes("application/x-moz-file"))) {
      setIsDragging(true);
    } else {
      // sometimes types is empty; still show to be permissive
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // show copy cursor for files
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // decrement counter and only hide when fully left
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // reset counter and hide overlay
    dragCounter.current = 0;
    setIsDragging(false);
    // do not change behavior: we don't auto-send files here.
    // ChatView or the rest of the app can handle dropped files if needed.
  }, []);

  return (
    <div
      style={{ position: "relative", height: "100%" }} // <-- change ici
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* overlay — absolute so it doesn't affect layout; pointerEvents none so it doesn't block events */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0, // top:0, right:0, bottom:0, left:0
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // légère transparence sans altérer le style du container
            background: "rgba(44, 42, 42, 0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            pointerEvents: "none" // important: let underlying container still receive drop
          }}
        >
          <div
            style={{
              pointerEvents: "none",
              padding: "10px 16px",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              fontWeight: 600
            }}
          >
            Déposez votre fichier ici
          </div>
        </div>
      )}

      <ChatView
        messages={messages}
        loading={loading}
        onSend={handleSend}
        onAttachFile={handleAttachFile} // ChatView will call this for dropped paths
      />
    </div>
  );
}
