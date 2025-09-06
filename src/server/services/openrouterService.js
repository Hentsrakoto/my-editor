// s'occupe d'appeler OpenRouter et d'extraire la réponse
const { OPENROUTER_KEY } = require("../config");

async function callOpenRouter(messages, model = "deepseek/deepseek-chat-v3.1:free", temperature = 0.2) {
  if (!OPENROUTER_KEY) {
    throw new Error("OPENROUTER_KEY not configured");
  }

  const payload = { model, messages, temperature };

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await resp.text();
  if (!resp.ok) {
    const err = new Error("Upstream error");
    err.status = resp.status;
    err.detail = text;
    throw err;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // réponse brute
    return typeof text === "string" ? text : JSON.stringify(text);
  }

  const reply =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.result ??
    JSON.stringify(data);

  return reply;
}

module.exports = { callOpenRouter };
