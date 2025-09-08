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
    const res = await readDir(p);
    return res;
  }, [readDir]);

  const handleOpenFile = useCallback(async (p) => {
    if (!p) return;
    const content = await (window?.api?.readFile ? window.api.readFile(p) : "");
    onOpenFile && onOpenFile(p, content);
  }, [onOpenFile]);

  const handleCreateItem = useCallback(async (fullPath, isFile = true) => {
    const normalized = normalizePath(fullPath);
    try {
      if (window?.api?.invoke) {
        if (isFile) {
          // create empty file
          const r = await window.api.invoke('write-file', normalized, "");
          if (!r || r?.success === false) throw new Error(r?.error || 'create file failed');
        } else {
          const r = await window.api.invoke('mkdir', normalized);
          if (!r || r?.success === false) throw new Error(r?.error || 'create folder failed');
        }
        await refresh();
      } else {
        if (isFile) await createFile(normalized);
        else await createFolder(normalized);
      }
    } catch (e) {
      console.error('create item failed', e);
    }
  }, [createFile, createFolder, refresh]);

  /**
   * Supprimer (file ou dir)
   * - pathToDelete : string
   * - isDir : optional boolean
   */
  const handleDelete = useCallback(async (pathToDelete, isDir = false) => {
    const p = normalizePath(pathToDelete);
    const name = p.split('/').pop();
    const confirmation = window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`);
    if (!confirmation) return;

    try {
      if (window?.api?.invoke) {
        // prefer explicit handler
        const handler = isDir ? 'delete-dir' : 'delete-file';
        let res = await window.api.invoke(handler, p);

        // fallback: if was not dir but delete-file failed, try delete-dir (and vice versa)
        if ((!res || res.success === false) && !isDir) {
          // try as dir as fallback
          try {
            const res2 = await window.api.invoke('delete-dir', p);
            if (res2 && res2.success) res = res2;
          } catch (e) { /* ignore fallback error */ }
        } else if ((!res || res.success === false) && isDir) {
          // try file fallback
          try {
            const res2 = await window.api.invoke('delete-file', p);
            if (res2 && res2.success) res = res2;
          } catch (e) { /* ignore fallback error */ }
        }

        if (!res || res.success === false) {
          throw new Error(res?.error || 'delete failed');
        }

        await refresh();
      } else {
        // fallback to hook
        await remove(p, isDir);
      }
    } catch (e) {
      console.error('delete failed', e);
    }
  }, [remove, refresh]);

  /**
   * Renommer (file ou dir)
   * - oldP, newP : string
   * - isDir : optional boolean
   */
  const handleRename = useCallback(async (oldP, newP, isDir = false) => {
    const o = normalizePath(oldP);
    const n = normalizePath(newP);
    try {
      if (window?.api?.invoke) {
        const handler = isDir ? 'rename-dir' : 'rename-file';
        let res = await window.api.invoke(handler, o, n);

        // fallback: if explicit handler failed, try the other one (useful if caller didn't know isDir)
        if ((!res || res.success === false) && !isDir) {
          try {
            const res2 = await window.api.invoke('rename-dir', o, n);
            if (res2 && res2.success) res = res2;
          } catch (e) { /* ignore fallback error */ }
        } else if ((!res || res.success === false) && isDir) {
          try {
            const res2 = await window.api.invoke('rename-file', o, n);
            if (res2 && res2.success) res = res2;
          } catch (e) { /* ignore fallback error */ }
        }

        if (!res || res.success === false) {
          throw new Error(res?.error || 'rename failed');
        }

        await refresh();
      } else {
        // fallback to hook rename
        await rename(o, n);
      }
    } catch (e) {
      console.error('rename failed', e);
    }
  }, [rename, refresh]);

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
