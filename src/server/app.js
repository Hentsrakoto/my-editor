const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// routes
app.use("/api/session", sessionRoutes);

// optionnel: /api/chat compat si tu veux garder l'ancien endpoint
// redirige vers /api/session/<new> si nécessaire. Ici on peut garder un handler
// simple ou une route qui crée une session temporaire.
app.post("/api/chat", (req, res) => {
  // backward-compat: créer session ad-hoc, envoyer message et renvoyer reply
  // Simple implémentation : create ephemeral session and forward to /api/session/:id/message
  return res.status(400).json({ error: "Use /api/session to create sessions and /api/session/:id/message to send messages" });
});

module.exports = app;
