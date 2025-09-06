import React, { useCallback, useEffect, useRef, useState } from "react";
import EditorToolbar from "../components/Editor/EditorToolbar";
import EditorView from "../components/Editor/EditorView";
import EditorStatusBar from "../components/Editor/EditorStatusBar";
import useLanguageFromPath from "../hooks/useLanguageFromPath";
import useFontSize from "../hooks/useFontSize";

/**
 * Props expected:
 * - file: { path: string, content: string, dirty?: boolean }
 * - onChangeFileContent(newContent)
 * - onSaveFile()
 */
export default function EditorTabContainer({ file, onChangeFileContent, onSaveFile }) {
  const language = useLanguageFromPath(file?.path);
  const { fontSize, increase, decrease, set } = useFontSize(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef(null);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [length, setLength] = useState(file?.content?.length || 0);

  useEffect(() => {
    setLength(file?.content?.length || 0);
  }, [file]);

  // Monaco onMount handler
  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
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

      return () => {
        disposable1.dispose();
        disposable2.dispose();
      };
    }
  }, []);

  // change handler: propagate up
  const handleChange = useCallback((value) => {
    onChangeFileContent?.(value);
  }, [onChangeFileContent]);

  // save handler
  const handleSave = useCallback(() => {
    onSaveFile?.();
  }, [onSaveFile]);

  // keyboard shortcuts (Ctrl/Cmd + S)
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      if (meta && e.key === "=") {
        // ctrl+ = increase
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

  const toggleFullscreen = () => setIsFullscreen(v => !v);

  return (
    <div className={`flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 ${isFullscreen ? "fixed inset-0 z-50" : "flex-1"}`}>
      <EditorToolbar
        path={file?.path || "Sans nom"}
        language={language}
        fontSize={fontSize}
        onIncreaseFont={increase}
        onDecreaseFont={decrease}
        onSave={handleSave}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        dirty={!!file?.dirty}
      />

      <EditorView
        language={language}
        content={file?.content || ""}
        fontSize={fontSize}
        onChange={handleChange}
        onMount={handleMount}
      />

      <EditorStatusBar line={cursor.line} column={cursor.column} length={length} />
    </div>
  );
}
