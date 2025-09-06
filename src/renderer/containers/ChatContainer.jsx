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

    // ChatContainer.jsx (extrait)
    const sendToApi = useCallback(async (message, context) => {
        // Use Electron IPC if available
        if (window?.api?.chat) {
            return window.api.chat({ message, contextFiles: context });
        }

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, contextFiles: context })
            });

            // Gérer statut non ok
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`API error ${res.status}: ${text || res.statusText}`);
            }

            // Récupérer texte brut (pour éviter JSON.parse sur corps vide)
            const textBody = await res.text();
            if (!textBody) throw new Error("Empty response from server");

            // Essayer parser JSON
            try {
                const data = JSON.parse(textBody);
                // data.reply attendu
                if (data?.reply) return data.reply;
                // si la structure est différente, essayer d'extraire
                return data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
            } catch (e) {
                // backend a renvoyé texte brut
                return textBody;
            }
        } catch (err) {
            console.error("ChatContainer API error:", err);
            // Remonter l'erreur pour useChat qui affichera un message bot d'erreur
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
