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
    const evtPath = event && (event.path || event.oldPath || event.newPath);
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
    // start root watcher if available
    try {
      if (typeof window.api.watchDir === "function") {
        window.api.watchDir(folder).catch(() => { });
      } else if (typeof window.api.invoke === "function") {
        // some preload might proxy watchDir; otherwise watcher is controlled from main via ipc events
        window.api.invoke("watch-dir", folder).catch(() => { });
      }
    } catch (e) { /* ignore */ }

    try {
      if (typeof window.api.onFsEvent === "function") {
        window.api.onFsEvent(onFsEventGlobal);
      } else if (typeof window.api.addListener === "function") {
        // some preload naming variations
        window.api.addListener("fs-event", onFsEventGlobal);
      }
    } catch (e) { /* ignore */ }

    return () => {
      try {
        if (typeof window.api.offFsEvent === "function") {
          window.api.offFsEvent(onFsEventGlobal);
        } else if (typeof window.api.removeListener === "function") {
          window.api.removeListener("fs-event", onFsEventGlobal);
        }
      } catch (e) { /* ignore */ }

      try {
        if (typeof window.api.unwatchDir === "function") {
          window.api.unwatchDir(folder).catch(() => { });
        } else if (typeof window.api.invoke === "function") {
          window.api.invoke("unwatch-dir", folder).catch(() => { });
        }
      } catch (e) { /* ignore */ }

      if (refreshTimeout.current) { clearTimeout(refreshTimeout.current); refreshTimeout.current = null; }
    };
  }, [folder, onFsEventGlobal]);

  const refresh = useCallback(() => setRefreshTrigger(r => r + 1), []);

  // create file (empty)
  const createFile = useCallback(async (path) => {
    if (!window?.api) throw new Error("No API");
    const p = normalizePath(path);
    if (typeof window.api.invoke === "function") {
      const res = await window.api.invoke("write-file", p, "");
      if (!res || res.success === false) throw new Error(res?.error || "write-file failed");
    } else if (typeof window.api.writeFile === "function") {
      await window.api.writeFile(p, "");
    } else {
      throw new Error("No writeFile API available");
    }
    setTimeout(() => setRefreshTrigger(r => r + 1), 30);
  }, []);

  // create folder
  const createFolder = useCallback(async (path) => {
    if (!window?.api) throw new Error("No API");
    const p = normalizePath(path);
    if (typeof window.api.invoke === "function") {
      const res = await window.api.invoke("mkdir", p);
      if (!res || res.success === false) throw new Error(res?.error || "mkdir failed");
    } else if (typeof window.api.mkdir === "function") {
      await window.api.mkdir(p);
    } else {
      throw new Error("No mkdir API available");
    }
    setTimeout(() => setRefreshTrigger(r => r + 1), 30);
  }, []);

  // read directory
  const readDir = useCallback(async (path) => {
    if (!window?.api) return [];
    const p = normalizePath(path);
    let entries;
    if (typeof window.api.invoke === "function") {
      const res = await window.api.invoke("read-dir", p);
      entries = res;
    } else if (typeof window.api.readDir === "function") {
      entries = await window.api.readDir(p);
    } else {
      return [];
    }
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

  // paste: copy or move the clipboard item into destinationPath
  const paste = useCallback(async (destinationPath) => {
    if (!clipboard || !window?.api) return;
    const sourceName = clipboard.sourcePath.split("/").pop();
    const destination = normalizePath(`${destinationPath}/${sourceName}`);
    try {
      if (typeof window.api.invoke === "function") {
        if (clipboard.operation === "copy") {
          if (clipboard.isDir) {
            const res = await window.api.invoke("copy-dir", clipboard.sourcePath, destination);
            if (!res || res.success === false) throw new Error(res?.error || "copy-dir failed");
          } else {
            const res = await window.api.invoke("copy-file", clipboard.sourcePath, destination);
            if (!res || res.success === false) throw new Error(res?.error || "copy-file failed");
          }
        } else if (clipboard.operation === "cut") {
          // use rename (generic) to move
          const res = await window.api.invoke("rename", clipboard.sourcePath, destination);
          if (!res || res.success === false) throw new Error(res?.error || "rename (move) failed");
          setClipboard(null);
        }
      } else {
        // fallback: try direct API names
        if (clipboard.operation === "copy") {
          if (clipboard.isDir && typeof window.api.copyDir === "function") {
            await window.api.copyDir(clipboard.sourcePath, destination);
          } else if (!clipboard.isDir && typeof window.api.copyFile === "function") {
            await window.api.copyFile(clipboard.sourcePath, destination);
          } else {
            throw new Error("No copy API available");
          }
        } else if (clipboard.operation === "cut") {
          if (typeof window.api.rename === "function") {
            await window.api.rename(clipboard.sourcePath, destination);
            setClipboard(null);
          } else {
            throw new Error("No rename API available");
          }
        }
      }

      setTimeout(() => setRefreshTrigger(r => r + 1), 30);
    } catch (err) {
      console.error("paste error", err);
      throw err;
    }
  }, [clipboard]);

  // remove: file or dir
  const remove = useCallback(async (path, isDir = false) => {
    if (!window?.api) throw new Error("No API");
    const p = normalizePath(path);

    try {
      if (isDir) {
        await window.api.unlinkDir(p);
      } else {
        await window.api.unlink(p);
      }
      setTimeout(() => setRefreshTrigger(r => r + 1), 30);
    } catch (err) {
      console.error("delete failed", err);
      throw err;
    }
  }, []);


  // rename (generic) - prefer 'rename' handler
  const rename = useCallback(async (oldPath, newPath) => {
    if (!window?.api) throw new Error("No API");
    const o = normalizePath(oldPath);
    const n = normalizePath(newPath);
    if (typeof window.api.invoke === "function") {
      // prefer generic rename
      let res = await window.api.invoke("rename", o, n);
      // fallback to specific handlers if generic fails
      if ((!res || res.success === false)) {
        try {
          const res2 = await window.api.invoke("rename-file", o, n);
          if (res2 && res2.success) res = res2;
        } catch (e) { }
        try {
          const res3 = await window.api.invoke("rename-dir", o, n);
          if (res3 && res3.success) res = res3;
        } catch (e) { }
      }
      if (!res || res.success === false) throw new Error(res?.error || "rename failed");
    } else {
      // fallback to direct rename
      if (typeof window.api.rename === "function") {
        await window.api.rename(o, n);
      } else {
        throw new Error("No rename API available");
      }
    }
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
