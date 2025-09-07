import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ChatMessage({ message }) {
  const isUser = message.sender === "user";
  const [copiedId, setCopiedId] = useState(null);

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-blue-500 ml-2" : "bg-purple-500 mr-2"
          }`}
        >
          {isUser ? "U" : "B"}
        </div>
        <div
          className={`px-3 py-2 rounded-lg ${
            isUser ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="text-sm whitespace-pre-line" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="ml-4 list-disc" {...props} />
              ),

              // Rendu custom pour le code
              code({ node, inline, className, children, ...props }) {
                const codeText = String(children).replace(/\n$/, "");
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                if (inline) {
                  return (
                    <code
                      className="bg-gray-800 px-1 rounded text-sm break-words"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                // Block code
                const id = Math.random().toString(36).slice(2, 9);

                // Rendu spécial pour git diff
                if (language === "diff" || language === "git") {
                  const lines = codeText.split("\n");
                  return (
                    <div className="relative my-2 font-mono text-sm">
                      <pre className="bg-gray-900 rounded-md overflow-x-auto border border-gray-600 p-2 leading-snug">
                        {lines.map((line, i) => {
                          let style = "text-gray-200"; // neutre
                          if (line.startsWith("+")) style = "text-green-400";
                          else if (line.startsWith("-")) style = "text-red-400";
                          else if (line.startsWith("@@"))
                            style = "text-purple-400 font-bold";

                          return (
                            <div key={i} className={style}>
                              {line}
                            </div>
                          );
                        })}
                      </pre>

                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(codeText);
                            setCopiedId(id);
                            setTimeout(() => setCopiedId(null), 1400);
                          } catch (e) {
                            console.error("copy failed", e);
                          }
                        }}
                        className="absolute top-2 right-2 text-xs bg-black bg-opacity-40 text-white px-2 py-1 rounded"
                        aria-label="Copier le patch"
                      >
                        {copiedId === id ? "Copié" : "Copier"}
                      </button>
                    </div>
                  );
                }

                // Rendu normal pour autres langages
                return (
                  <div className="relative my-2">
                    <div className="rounded-md overflow-hidden border border-gray-600">
                      <SyntaxHighlighter
                        language={language}
                        style={atomDark}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: "0.75rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        {codeText}
                      </SyntaxHighlighter>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(codeText);
                          setCopiedId(id);
                          setTimeout(() => setCopiedId(null), 1400);
                        } catch (e) {
                          console.error("copy failed", e);
                        }
                      }}
                      className="absolute top-2 right-2 text-xs bg-black bg-opacity-40 text-white px-2 py-1 rounded"
                      aria-label="Copier le code"
                    >
                      {copiedId === id ? "Copié" : "Copier"}
                    </button>
                  </div>
                );
              },
            }}
          >
            {message.text}
          </ReactMarkdown>

          <p
            className={`text-xs mt-1 ${
              isUser ? "text-blue-200" : "text-gray-400"
            }`}
          >
            {time}
          </p>
        </div>
      </div>
    </div>
  );
}
