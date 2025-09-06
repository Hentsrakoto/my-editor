// hooks/useFileExplorer.js
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizePath, sortEntries } from "../utils/fsUtils";

/**
 * useFileExplorer
 * - folder: root path
 * - returns state + handlers: readDir, watch/unwatch, create, copy/cut/paste, refresh, search
 */
export default function useFileExplorer({ folder } = {}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clipboard, setClipboard] = useState(null); // { operation:'copy'|'cut', sourcePath, isDir }
  const currentFolderRef = useRef(folder);
  const refreshTimeout = useRef(null);

  useEffect(() => { currentFolderRef.current = folder; }, [folder]);

  // global fs event handler (debounced refresh)
  const onFsEventGlobal = useCallback((event) => {
    const evtPath = event && event.path;
    if (!evtPath || !currentFolderRef.current) return;
    const a = normalizePath(evtPath).toLowerCase();
    const b = normalizePath(currentFolderRef.current).toLowerCase();
    if (a === b || a.startsWith(b + "/")) {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => {
        setRefreshTrigger(r => r + 1);
        refreshTimeout.current = null;
      }, 60);
    }
  }, []);

  useEffect(() => {
    if (!folder || !window?.api) return;
    // start root watcher
    window.api.watchDir(folder).catch(() => {});
    window.api.onFsEvent(onFsEventGlobal);
    return () => {
      try { window.api.offFsEvent(onFsEventGlobal); } catch (e) {}
      window.api.unwatchDir(folder).catch(() => {});
      if (refreshTimeout.current) { clearTimeout(refreshTimeout.current); refreshTimeout.current = null; }
    };
  }, [folder, onFsEventGlobal]);

  const refresh = useCallback(() => setRefreshTrigger(r => r + 1), []);

  const createFile = useCallback(async (path) => {
    if (!window?.api) throw new Error("No API");
    await window.api.writeFile(path, "");
    // optimistic refresh
    setTimeout(() => setRefreshTrigger(r => r + 1), 30);
  }, []);

  const createFolder = useCallback(async (path) => {
    if (!window?.api) throw new Error("No API");
    await window.api.mkdir(path);
    setTimeout(() => setRefreshTrigger(r => r + 1), 30);
  }, []);

  const readDir = useCallback(async (path) => {
    if (!window?.api) return [];
    const entries = await window.api.readDir(path);
    if (!entries) return [];
    return (entries.map(e => ({
      name: e.name,
      isDir: !!(e.isDir || e.isDirectory),
      size: e.size || 0
    })).sort(sortEntries));
  }, []);

  const copy = useCallback((sourcePath, isDir = false) => {
    setClipboard({ operation: "copy", sourcePath, isDir });
  }, []);

  const cut = useCallback((sourcePath, isDir = false) => {
    setClipboard({ operation: "cut", sourcePath, isDir });
  }, []);

  const paste = useCallback(async (destinationPath) => {
    if (!clipboard || !window?.api) return;
    const sourceName = clipboard.sourcePath.split("/").pop();
    const destination = `${destinationPath}/${sourceName}`;
    try {
      if (clipboard.operation === "copy") {
        if (clipboard.isDir) await window.api.copyDir(clipboard.sourcePath, destination);
        else await window.api.copyFile(clipboard.sourcePath, destination);
      } else if (clipboard.operation === "cut") {
        await window.api.rename(clipboard.sourcePath, destination);
        setClipboard(null);
      }
      setTimeout(() => setRefreshTrigger(r => r + 1), 30);
    } catch (err) {
      console.error("paste error", err);
      throw err;
    }
  }, [clipboard]);

  const remove = useCallback(async (path, isDir=false) => {
    if (!window?.api) throw new Error("No API");
    if (isDir) await window.api.rmdir(path);
    else await window.api.unlink(path);
    setTimeout(() => setRefreshTrigger(r => r + 1), 30);
  }, []);

  const rename = useCallback(async (oldPath, newPath) => {
    if (!window?.api) throw new Error("No API");
    await window.api.rename(oldPath, newPath);
    setTimeout(() => setRefreshTrigger(r => r + 1), 30);
  }, []);

  return {
    refreshTrigger,
    refresh,
    readDir,
    createFile,
    createFolder,
    copy,
    cut,
    paste,
    clipboard,
    remove,
    rename
  };
}
