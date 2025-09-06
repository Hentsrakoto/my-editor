import React from "react";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? "flex-row-reverse" : ""}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-blue-500 ml-2" : "bg-purple-500 mr-2"}`}>
          {isUser ? "U" : "B"}
        </div>
        <div className={`px-3 py-2 rounded-lg ${isUser ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}>
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="text-sm whitespace-pre-line" {...props} />,
              li: ({ node, ...props }) => <li className="ml-4 list-disc" {...props} />,
              code: ({ node, ...props }) => <code className="bg-gray-800 px-1 rounded" {...props} />
            }}
          >
            {message.text}
          </ReactMarkdown>
          <p className={`text-xs mt-1 ${isUser ? "text-blue-200" : "text-gray-400"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </p>
        </div>
      </div>
    </div>
  );
}
