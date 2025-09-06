import { useCallback, useEffect, useState } from "react";

/**
 * useSidebarActions
 * - gère activeButton, recentFolders, openFolder, newFile
 * - expose des handlers testables (ne fait pas directement window.api calls si possible)
 */
export default function useSidebarActions({ onNewFile, onOpenFolderExternal } = {}) {
  const [activeButton, setActiveButton] = useState(null);
  const [recentFolders, setRecentFolders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentFolders") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("recentFolders", JSON.stringify(recentFolders));
  }, [recentFolders]);

  const pulse = (action) => {
    setActiveButton(action);
    setTimeout(() => setActiveButton(null), 300);
  };

  const handleOpenFolder = useCallback(async () => {
    pulse("open");
    try {
      // onOpenFolderExternal est une abstraction injectable (testable)
      const folder = onOpenFolderExternal ? await onOpenFolderExternal() : await window.api.openFolder();
      if (folder) {
        setRecentFolders(prev => {
          const dedup = [folder, ...prev.filter(f => f !== folder)].slice(0, 6);
          return dedup;
        });
        return folder;
      }
    } catch (err) {
      console.error("openFolder error:", err);
      return null;
    }
  }, [onOpenFolderExternal]);

  const handleNewFile = useCallback(() => {
    pulse("new");
    onNewFile && onNewFile();
  }, [onNewFile]);

  const clearRecent = useCallback(() => setRecentFolders([]), []);

  return {
    activeButton,
    recentFolders,
    handleOpenFolder,
    handleNewFile,
    pulse,
    clearRecent,
    setRecentFolders
  };
}
