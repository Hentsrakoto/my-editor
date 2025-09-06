import React, { useState } from "react";
import { MessageSquare, Terminal } from "lucide-react";
import ChatContainer from "../../containers/ChatContainer";
import TerminalContainer from "../../containers/TerminalContainer";

const SidebarRight = ({ contextFiles }) => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="w-80 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 h-full border-l border-gray-700">
      <div className="flex border-b border-gray-700 bg-gray-800/90">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
            activeTab === 'chat'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
            activeTab === 'terminal'
              ? 'text-green-400 border-b-2 border-green-400 bg-gray-900'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('terminal')}
        >
          <Terminal size={16} />
          Terminal
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? <ChatContainer contextFiles={contextFiles} /> : <TerminalContainer />}
      </div>
    </div>
  );
};

export default SidebarRight;
