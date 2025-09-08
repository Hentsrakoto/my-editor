import React, { useCallback } from "react";
import SidebarView from "../components/sidebar/SidebarView";
import useSidebarActions from "../hooks/useSidebarActions";
import useTheme from "../hooks/useTheme";

/**
 * SidebarContainer
 * - injectable handlers for testability
 * - uses window.api when available (Electron IPC)
 */
export default function SidebarContainer({ onNewFile, onOpenFolder, onToggleSearch }) {
  const { activeButton, recentFolders, handleOpenFolder, handleNewFile, clearRecent, setRecentFolders } = useSidebarActions({
    onNewFile,
    onOpenFolderExternal: async () => {
      // prefer injected onOpenFolder, fallback to window.api
      if (onOpenFolder) {
        return onOpenFolder(); // should return folder path
      }
      if (window?.api?.openFolder) {
        return await window.api.openFolder();
      }
      console.warn("No openFolder handler configured.");
      return null;
    }
  });

  const { theme, toggle } = useTheme();

  const openGithub = useCallback(() => {
    window.open("https://github.com", "_blank");
  }, []);

  const openRecent = useCallback(async (folder) => {
    // call host to open or set as current folder
    if (window?.api?.setCurrentFolder) {
      await window.api.setCurrentFolder(folder);
    }
    // update recent order
    setRecentFolders(prev => [folder, ...prev.filter(f => f !== folder)].slice(0, 6));
  }, [setRecentFolders]);

  return (
    <SidebarView
      activeButton={activeButton}
      onOpenFolder={handleOpenFolder}
      onNewFile={handleNewFile}
      onToggleSearch={onToggleSearch}
      onToggleTheme={toggle}
      onSettings={() => console.log("Open settings")}
      onOpenGithub={openGithub}
      recentFolders={recentFolders}
      onOpenRecent={openRecent}
      onClearRecent={clearRecent}
    />
  );
}
