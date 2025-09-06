const path = require("path");
const dotenv = require("dotenv");

// charge api.env (ajuste le chemin si besoin)
dotenv.config({ path: path.resolve(__dirname, "../../api.env") });

module.exports = {
  PORT: process.env.PORT || 3001,
  OPENROUTER_KEY: process.env.OPENROUTER_API_KEY || "",
  SESSION_TTL_MS: Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60), // 1h par défaut
  SESSION_CLEANUP_INTERVAL_MS: Number(process.env.SESSION_CLEANUP_INTERVAL_MS || 1000 * 60 * 5), // 5min
  MAX_CONTEXT_MESSAGES: 2
};
