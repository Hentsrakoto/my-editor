import React, { useCallback, useEffect, useRef, useState } from "react";
import EditorToolbar from "../components/Editor/EditorToolbar";
import EditorView from "../components/Editor/EditorView";
import EditorStatusBar from "../components/Editor/EditorStatusBar";
import useLanguageFromPath from "../hooks/useLanguageFromPath";
import useFontSize from "../hooks/useFontSize";

export default function EditorTabContainer({
  file,
  onChangeFileContent,
  onSaveFile,
  onCloseFile,
  onSwitchFile
}) {
  const language = useLanguageFromPath(file?.path);
  const { fontSize, increase, decrease } = useFontSize(14);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // refs for editor + monaco + disposables
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const disposablesRef = useRef([]);

  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [length, setLength] = useState(file?.content?.length || 0);

  // Multi-tab state
  const [openFiles, setOpenFiles] = useState(file ? [{
    id: file.path,
    path: file.path,
    content: file.content || "",
    dirty: !!file.dirty
  }] : []);
  const [activeFileId, setActiveFileId] = useState(file?.path || null);

  // Get language for active file - DOIT être appelé UNIQUEMENT ici
  const activeFile = openFiles.find((f) => f.id === activeFileId);
  const activeFileLanguage = useLanguageFromPath(activeFile?.path);

  // Sync incoming prop `file`
  useEffect(() => {
    if (!file || !file.path) return;

    const id = file.path;
    setOpenFiles((prev) => {
      const exists = prev.find((f) => f.id === id);
      if (exists) {
        return prev.map((f)=>
          f.id === id ? { ...f, content: file.content, dirty: !!file.dirty } : f
        );
      }
      return [...prev, {
        id,
        path: file.path,
        content: file.content || "",
        dirty: !!file.dirty
      }];
    });

    if (!activeFileId) {
      setActiveFileId(id);
    }
  }, [file, activeFileId]);

  // Monaco onMount
  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    disposablesRef.current.forEach(d => d?.dispose?.());
    disposablesRef.current = [];

    const model = editor.getModel();
    if (model) {
      const updatePos = () => {
        const pos = editor.getPosition();
        if (pos) setCursor({ line: pos.lineNumber, column: pos.column });
      };
      updatePos();

      const disposable1 = editor.onDidChangeCursorPosition(updatePos);
      const disposable2 = model.onDidChangeContent(() => {
        setLength(model.getValueLength());
      });

      disposablesRef.current.push(disposable1, disposable2);
    }
  }, []);

  // cleanup disposables on unmount
  useEffect(() => {
    return () => {
      disposablesRef.current.forEach(d => d?.dispose?.());
    };
  }, []);

  // change handler
  const handleChange = useCallback((value) => {
    if (activeFileId) {
      setOpenFiles((prev)=>
        prev.map((f)=>
          f.id === activeFileId ? { ...f, content: value, dirty: true } : f
        )
      );
      onChangeFileContent?.(value, activeFileId);
    }
  }, [activeFileId, onChangeFileContent]);

  // save handler
  const handleSave = useCallback(() => {
    if (activeFileId) {
      onSaveFile?.(activeFileId);
      setOpenFiles((prev)=>
        prev.map((f)=>
          f.id === activeFileId ? { ...f, dirty: false } : f
        )
      );
    }
  }, [activeFileId, onSaveFile]);

  // switch tab
  const setActiveFile = useCallback((id) => {
    const target = openFiles.find((f) => f.id === id);
    if (target) {
      setActiveFileId(id);
      onSwitchFile?.(id, target.content);
    }
  }, [openFiles, onSwitchFile]);

  // close tab
  const closeFile = useCallback((id) => {
    setOpenFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);

      if (id === activeFileId) {
        const remainingIds = newFiles.map(f => f.id);
        const newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;

        setActiveFileId(newActiveId);

        if (newActiveId) {
          const newActiveFile = newFiles.find(f => f.id === newActiveId);
          onSwitchFile?.(newActiveId, newActiveFile.content);
        } else {
          onCloseFile?.(id);
        }
      }

      return newFiles;
    });

    onCloseFile?.(id);
  }, [activeFileId, onCloseFile, onSwitchFile]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      if (meta && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        increase();
      }
      if (meta && e.key === "-") {
        e.preventDefault();
        decrease();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, increase, decrease]);

  // Synchronise Monaco avec l'onglet actif
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const newContent = activeFile?.content ?? "";

    if (!editor || !activeFile) return;

    const model = editor.getModel();
    if (!model) return;

    if (model.getValue() !== newContent) {
      const prevPos = editor.getPosition?.() || null;
      const prevSelection = editor.getSelection?.() || null;

      model.setValue(newContent);

      if (prevPos) {
        editor.setPosition(prevPos);
        editor.revealPositionInCenter(prevPos);
      }
      if (prevSelection) {
        editor.setSelection(prevSelection);
      }
    }

    // Utilise la langue précalculée
    if (monaco?.editor?.setModelLanguage) {
      monaco.editor.setModelLanguage(model, activeFileLanguage || "plaintext");
    }

    setLength(newContent.length);
  }, [activeFileId, activeFile, activeFileLanguage]);

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  if (openFiles.length === 0) {
    return (
      <div className="flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 flex-1 items-center justify-center">
        <p className="text-gray-400">Aucun fichier ouvert</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 ${isFullscreen ? "fixed inset-0 z-50" : "flex-1"}`}>
      <EditorToolbar
        files={openFiles}
        activeFileId={activeFileId}
        onSelectFile={setActiveFile}
        onCloseFile={closeFile}
        currentPath={activeFile?.path || ""}
        language={activeFileLanguage} // Utilise la langue précalculée
        fontSize={fontSize}
        onIncreaseFont={increase}
        onDecreaseFont={decrease}
        onSave={handleSave}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      <EditorView
        language={activeFileLanguage} // Utilise la langue précalculée
        content={activeFile?.content || ""}
        fontSize={fontSize}
        onChange={handleChange}
        onMount={handleMount}
      />

      <EditorStatusBar
        line={cursor.line}
        column={cursor.column}
        length={length}
      />
    </div>
  );
}
