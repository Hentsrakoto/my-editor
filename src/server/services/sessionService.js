// service simple en mémoire - stocke messages et timestamp
const { makeId } = require("../utils/id");
const { SESSION_TTL_MS, SESSION_CLEANUP_INTERVAL_MS } = require("../config");

class SessionService {
  constructor() {
    this.sessions = new Map(); // sessionId -> { createdAt, updatedAt, messages: [{role, text, timestamp}] }
    this._startCleanup();
  }

  createSession(initialMessages = []) {
    const id = makeId("sess_");
    const now = Date.now();
    this.sessions.set(id, {
      createdAt: now,
      updatedAt: now,
      messages: [...initialMessages]
    });
    return id;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  appendMessage(sessionId, role, text) {
    const sess = this.sessions.get(sessionId);
    if (!sess) return null;
    const msg = { role, text, timestamp: new Date().toISOString() };
    sess.messages.push(msg);
    sess.updatedAt = Date.now();
    return msg;
  }

  getLastMessages(sessionId, count = 2) {
    const sess = this.sessions.get(sessionId);
    if (!sess) return [];
    const m = sess.messages.slice(-count);
    // retourner copie
    return m.map(x => ({ ...x }));
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  _startCleanup() {
    this._cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, s] of this.sessions.entries()) {
        if (now - s.updatedAt > SESSION_TTL_MS) {
          this.sessions.delete(id);
        }
      }
    }, SESSION_CLEANUP_INTERVAL_MS);
  }

  stop() {
    clearInterval(this._cleanupInterval);
  }
}

module.exports = new SessionService();
