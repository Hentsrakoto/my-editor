// src/hooks/useChat.js
import { useCallback, useRef, useState } from "react";

/**
 * useChat
 * - messages : [{id, sender: 'bot'|'user', text, timestamp}]
 * - sendMessage: gère l'ajout local et l'appel à l'API via sendToApi
 */
export default function useChat({ initialMessages = [], sendToApi } = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const idRef = useRef(messages.length + 1);

  const addMessage = useCallback((msg) => {
    idRef.current += 1;
    setMessages(prev => [...prev, { id: idRef.current, timestamp: new Date(), ...msg }]);
  }, []);

  const sendMessage = useCallback(async (text, contextFiles) => {
    if (!text || !text.trim()) return;

    // ajoute d'abord le message utilisateur localement
    addMessage({ text, sender: "user" });

    setLoading(true);
    try {
      const botText = await (sendToApi ? sendToApi(text, contextFiles) : Promise.resolve("No API handler configured."));
      addMessage({ text: botText, sender: "bot" });
      return botText;
    } catch (err) {
      console.error("useChat sendMessage error:", err);
      addMessage({ text: "⚠️ Erreur lors de la connexion à l'IA.", sender: "bot" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addMessage, sendToApi]);

  return {
    messages,
    loading,
    sendMessage,
    addMessage,
    setMessages,
  };
}
