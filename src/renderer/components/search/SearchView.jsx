import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchView({ query, setQuery, onSearch, results, onOpenFile, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400 h-full">
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <h2 className="font-semibold text-gray-200 mb-2">Rechercher</h2>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans les fichiers..."
            className="w-full bg-gray-900 border border-gray-700 rounded-md pl-8 pr-4 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="p-2 text-center">Recherche en cours...</p>}
        {!loading && results.length === 0 && (
          <p className="p-2 text-center text-sm">Aucun résultat.</p>
        )}
        {!loading && results.map((result, index) => (
          <div key={index} className="mb-2 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer" onClick={() => onOpenFile(result.filePath, result.lineNumber)}>
            <div className="font-semibold text-gray-200 truncate text-sm">
              {result.filePath.split(/[\/]/).pop()}
            </div>
            <div className="text-xs text-gray-500 mb-1">{result.filePath}</div>
            <div className="text-xs bg-gray-900 p-1 rounded">
              <span className="text-yellow-400 mr-2">{result.lineNumber}:</span>
              <span className="text-gray-300">{result.lineContent}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
