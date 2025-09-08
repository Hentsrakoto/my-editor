import React, { useState, useCallback } from 'react';
import SearchView from './SearchView';

export default function SearchContainer({ directory, onOpenFile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !directory) return;
    setLoading(true);
    try {
      const searchResults = await window.api.searchInFiles(query, directory);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, directory]);

  const handleOpenFile = (filePath, lineNumber) => {
    // We need to read the file content before calling onOpenFile
    // which expects the content.
    window.api.readFile(filePath).then(content => {
      onOpenFile(filePath, content, lineNumber);
    });
  };

  return (
    <SearchView 
      query={query}
      setQuery={setQuery}
      onSearch={handleSearch}
      results={results}
      onOpenFile={handleOpenFile}
      loading={loading}
    />
  );
}
