// containers/FileExplorerContainer.jsx
import React, { useCallback } from "react";
import FileExplorerView from "../components/file-explorer/FileExplorerView";
import useFileExplorer from "../hooks/useFileExplorer";
import { normalizePath } from "../utils/fsUtils";

/**
 * Container:
 * - expose fonctions injectées à la view (readDir, create, paste, etc.)
 * - centralise les interactions avec window.api
 */
export default function FileExplorerContainer({ folder, onOpenFile, currentFilePath }) {
  const {
    refreshTrigger, refresh, readDir,
    createFile, createFolder,
    copy, cut, paste, clipboard,
    remove, rename
  } = useFileExplorer({ folder });

  // adapters -> map to window.api when needed
  const readDirHandler = useCallback(async (p) => {
    if (!window?.api) return [];
    // normalize path
    const res = await readDir(p);
    return res;
  }, [readDir]);

  const handleOpenFile = useCallback(async (p) => {
    if (!p) return;
    const content = await (window?.api?.readFile ? window.api.readFile(p) : "");
    onOpenFile && onOpenFile(p, content);
  }, [onOpenFile]);

  const handleCreateItem = useCallback(async (fullPath, isFile = true) => {
    if (isFile) await createFile(fullPath);
    else await createFolder(fullPath);
  }, [createFile, createFolder]);

  const handleDelete = useCallback(async (pathToDelete, isDir=false) => {
    try { await remove(pathToDelete, isDir); } catch(e){ console.error(e); }
  }, [remove]);

  const handleRename = useCallback(async (oldP, newP) => {
    try { await rename(oldP, newP); } catch(e){ console.error(e); }
  }, [rename]);

  const handleCopy = useCallback((p, isDir) => copy(p, isDir), [copy]);
  const handleCut = useCallback((p, isDir) => cut(p, isDir), [cut]);
  const handlePaste = useCallback(async (dest) => paste(dest), [paste]);

  return (
    <FileExplorerView
      folder={folder}
      readDir={readDirHandler}
      onOpenFile={handleOpenFile}
      onCreateItem={handleCreateItem}
      onDeleteItem={handleDelete}
      onRenameItem={handleRename}
      clipboard={clipboard}
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
      refreshTrigger={refreshTrigger}
      onRefresh={refresh}
      currentFilePath={currentFilePath}
    />
  );
}
