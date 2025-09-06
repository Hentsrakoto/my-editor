import React from "react";

export default function SidebarButton({ Icon, label, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 text-xs ${
        active ? "bg-gray-700 text-white shadow-lg transform scale-105" : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
      title={title || label}
      aria-pressed={!!active}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );
}
