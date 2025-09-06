// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors()); // utile pour tests sans proxy, mais en dev on utilisera le proxy vite

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_KEY) {
  console.warn("⚠️ OPENROUTER_API_KEY non défini. Placez-le dans le .env");
}

app.post("/api/chat", async (req, res) => {
  const { message, contextFiles } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: "message required" });

  try {
    const payload = {
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        { role: "system", content: "Tu es un assistant spécialisé pour aider sur du code dans un éditeur." },
        { role: "user", content: contextFiles ? `Contexte disponible:\n${contextFiles}\n\nQuestion:\n${message}` : message }
      ],
      temperature: 0.2,
      // max_tokens, top_p, etc. : ajoute si besoin
    };

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        // Optionnel : "HTTP-Referer": "https://tonsite.example", "X-Title": "Mon éditeur"
      },
      body: JSON.stringify(payload),
      // timeout handling could être ajouté côté wrapper si besoin
    });

    const text = await resp.text(); // lit le corps brut
    if (!resp.ok) {
      // renvoyer contexte d'erreur utile au front (mais sans exposer la clé)
      console.error("OpenRouter error", resp.status, text);
      return res.status(502).json({ error: "Upstream error", status: resp.status, detail: text });
    }

    // Essayer de parser JSON ; OpenRouter renvoie JSON similaire à OpenAI
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // si parsing échoue, renvoyer le texte brut
      return res.json({ reply: text });
    }

    // Extraction prudente du contenu
    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.result ??
      JSON.stringify(data);

    return res.json({ reply });
  } catch (err) {
    console.error("Server /api/chat error:", err);
    return res.status(500).json({ error: "internal server error", detail: String(err) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API server running on http://localhost:${port}`));
