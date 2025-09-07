const express = require("express");
const router = express.Router();
const sessionService = require("../services/sessionService");
const { callOpenRouter } = require("../services/openrouterService");
const { MAX_CONTEXT_MESSAGES } = require("../config");

// system prompt
const SYSTEM_PROMPT = `
Tu es un assistant IA expert en développement logiciel et en revue de code. Réponds en français. Utilise uniquement la conversation précédente et les fichiers/contexte fournis. Si une information nécessaire est manquante, indique précisément ce qui manque (fichier, commande, logs) au lieu d'inventer des faits.

Pour chaque tâche, suis ce plan :
1) Résumé concis (1–3 phrases).
2) Solution proposée avec justification (choix techniques et compromis).
3) Patch git prêt à appliquer (diff unifié) et message de commit recommandé.
4) Test(s) ou steps manuels pour valider (ex : lignes de commande, unit tests).
5) Risques, régressions possibles et recommandations (sécurité, compatibilité, perf).
6) Alternatives (si pertinentes) avec avantages/inconvénients.

Règles strictes :
- Ne révèle jamais de secrets (tokens, clés) extraits du contexte ; signale et demande leur retrait s'ils apparaissent.
- Préfère des modifications minimes et réversibles (petits commits).
- Respecte le style et les linters du projet (ou propose lesquels appliquer).
- Si tu es incertain, propose une hypothèse explicitée et les tests permettant de la valider.

Format de sortie préféré : 
Résumé suivi du patch entre balises \`\`\`diff\`\`\`, un bloc "Tests" et un bloc "Notes". Sois concis et opérationnel.

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
