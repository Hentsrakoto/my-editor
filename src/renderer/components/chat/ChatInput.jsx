import React, { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const submit = (e) => {
    e?.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };
  return (
    <form onSubmit={submit} className="p-3 border-t border-gray-700 bg-gray-800 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tapez votre message... (/fichier ou @dossier pour contexte)"
        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button type="submit" disabled={disabled} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
        <Send size={16} />
      </button>
    </form>
  );
}
