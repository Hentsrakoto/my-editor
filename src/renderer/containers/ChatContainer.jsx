// src/renderer/ChatContainer.jsx (ou ton emplacement)
import React from "react";
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

  return (
    <ChatView
      messages={messages}
      loading={loading}
      onSend={handleSend}
      onAttachFile={handleAttachFile} // ChatView will call this for dropped paths
    />
  );
}
