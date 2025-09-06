import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatView({ messages, loading, onSend }) {
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
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

      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  );
}
