import React from 'react';
import Editor from '@monaco-editor/react';

export default function EditorTab({ file, onChange, onSave }) {
  if (!file) return <div style={{ flex: 1 }}>Aucun fichier ouvert</div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 5, borderBottom: '1px solid #ccc' }}>
        {file.path} {file.dirty ? '*' : ''}
        <button onClick={onSave} style={{ marginLeft: 10 }}>💾 Sauvegarder</button>
      </div>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={file.content}
        onChange={onChange}
      />
    </div>
  );
}
