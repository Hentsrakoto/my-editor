import React from 'react';

export default function Sidebar({ onOpenFolder }) {
  const handleOpenFolder = async () => {
    const folder = await window.api.openFolder();
    if (folder) onOpenFolder(folder);
  };

  return (
    <div style={{ width: 200, padding: 10, borderRight: '1px solid #ccc' }}>
      <button onClick={handleOpenFolder}>Ouvrir dossier</button>
    </div>
  );
}
