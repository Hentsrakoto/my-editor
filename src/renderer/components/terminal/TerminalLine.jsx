import React from "react";

export default function TerminalLine({ line }) {
  return (
    <div className={line.type === "command" ? "text-green-400" : "text-gray-300"}>
      {line.text}
    </div>
  );
}
