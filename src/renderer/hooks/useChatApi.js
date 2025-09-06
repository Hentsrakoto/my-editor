import { useCallback } from "react";

const SESSION_KEY = "chat_session_id";

async function createSession() {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cannot create session: ${res.status} ${txt || res.statusText}`);
  }
  const data = await res.json();
  console.log("Created new session:", data);
  return data.sessionId;
}

async function ensureSession() {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (sessionId) {
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      if (res.ok) {
        return sessionId; // session existante, on la garde
      }
    } catch (err) {
      console.warn("Cannot verify session, creating new one", err);
    }
  }

  // sinon, créer une nouvelle session
  sessionId = await createSession();
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}


async function filesToContext(files) {
  if (!files || !files.length) return "";
  const results = [];
  for (const file of files) {
    const text = await file.text(); // lit le contenu
    results.push(`Fichier: ${file.name}\n${text}`);
  }
  return results.join("\n\n");
}

async function legacyChatCall(message, context) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, contextFiles: context })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  const textBody = await res.text();
  if (!textBody) throw new Error("Empty response from server");

  try {
    const data = JSON.parse(textBody);
    if (data?.reply) return data.reply;
    return data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
  } catch {
    return textBody;
  }
}

export default function useChatApi() {
  const sendToApi = useCallback(async (message, files = []) => {
    // 1) Electron IPC
    if (window?.api?.chat) {
      return window.api.chat({ message, contextFiles: files });
    }

    // 2) Session-based API
    const sessionId = await ensureSession();
    const contextString = await filesToContext(files);

    // fusion message + contexte
    const messageWithContext = contextString
      ? `Contexte disponible:\n${contextString}\n\nQuestion:\n${message}`
      : message;

    try {
      const res = await fetch(`/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageWithContext })
      });

      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) {
          return legacyChatCall(message, contextString);
        }
        const txt = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${txt || res.statusText}`);
      }

      const data = await res.json();
      return data?.reply ?? data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
    } catch (err) {
      try {
        return await legacyChatCall(message, contextString);
      } catch (legacyErr) {
        console.error("Chat API failed:", err, legacyErr);
        throw err;
      }
    }
  }, []);

  return { sendToApi };
}
