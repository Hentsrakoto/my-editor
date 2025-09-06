const express = require("express");
const router = express.Router();
const sessionService = require("../services/sessionService");
const { callOpenRouter } = require("../services/openrouterService");
const { MAX_CONTEXT_MESSAGES } = require("../config");

// system prompt
const SYSTEM_PROMPT = `
Tu es un assistant IA spécialisé en code. 
Réponds en te basant sur la conversation précédente.
Ne dis jamais que tu n’as pas d’historique.
`;

router.post("/", (req, res) => {
  // optional: accept initial messages from body
  const initial = req.body?.initialMessages || [
    { role: "system", text: SYSTEM_PROMPT }
  ];
  const sessionId = sessionService.createSession(initial);
  return res.json({ sessionId });
});

// POST /api/session/:id/message
router.post("/:id/message", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { message, contextFiles } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: "message required" });

    const session = sessionService.getSession(sessionId);
    if (!session) return res.status(404).json({ error: "session not found" });

    // append user message
    sessionService.appendMessage(sessionId, "user", message);

    // build messages to send to OpenRouter:
    // - system prompt (if any in session messages) otherwise default
    // - last MAX_CONTEXT_MESSAGES messages from session (role + text)
    const lastMessages = sessionService.getLastMessages(sessionId, MAX_CONTEXT_MESSAGES);
    // ensure system prompt first
    const hasSystem = (session.messages || []).some(m => m.role === "system");
    const messagesForOpen = [];
    if (!hasSystem) messagesForOpen.push({ role: "system", content: SYSTEM_PROMPT });

    // include contextFiles as a user/system message if provided
    if (contextFiles) {
      messagesForOpen.push({ role: "system", content: `Contexte disponible:\n${contextFiles}` });
    }

    // map last messages to expected shape
    for (const m of lastMessages) {
      messagesForOpen.push({ role: m.role, content: m.text });
    }

    // Call upstream
    const replyText = await callOpenRouter(messagesForOpen);

    // append assistant reply to session
    sessionService.appendMessage(sessionId, "assistant", replyText);

    return res.json({ reply: replyText });
  } catch (err) {
    console.error("session message error:", err);
    return res.status(err.status || 500).json({ error: "server error", detail: err.detail ?? String(err) });
  }
});

// GET /api/session/:id
router.get("/:id", (req, res) => {
  const sessionId = req.params.id;
  const session = sessionService.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "session not found" });
  return res.json(session);
});

module.exports = router;
