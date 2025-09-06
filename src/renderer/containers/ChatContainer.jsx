import React, { useCallback } from "react";
import ChatView from "../components/chat/ChatView";
import useChat from "../hooks/useChat";

/**
 * ChatContainer
 * - sendToApi abstracts away the transport:
 *   - in Electron: window.api.chat(message, contextFiles)
 *   - in web: POST to /api/chat (server keeps the private API key)
 */
export default function ChatContainer({ contextFiles }) {

  const sendToApi = useCallback(async (message, context) => {
    // IMPORTANT: never put API key here. Use backend or Electron IPC (window.api).
    if (window?.api?.chat) {
      // Electron main process handles the key and calls the remote API
      return window.api.chat({ message, contextFiles: context });
    }

    // Fallback: call your backend endpoint (server holds the secret)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, contextFiles: context })
      });
      const data = await res.json();
      return data?.reply || "Aucune réponse.";
    } catch (err) {
      console.error("ChatContainer API error:", err);
      throw err;
    }
  }, []);

  const { messages, loading, sendMessage } = useChat({
    initialMessages: [{
      id: 1,
      text: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }],
    sendToApi
  });

  return <ChatView messages={messages} loading={loading} onSend={(text) => sendMessage(text, contextFiles)} />;
}
