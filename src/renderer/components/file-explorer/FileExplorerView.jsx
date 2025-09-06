// components/file-explorer/FileExplorerView.jsx
import React from "react";
import FolderNode from "./FolderNode";
import { FolderOpen } from "lucide-react";
import { getNameFromPath } from "../../utils/fsUtils";

export default function FileExplorerView({
  folder,
  readDir,
  onOpenFile,
  onCreateItem,
  onDeleteItem,
  onRenameItem,
  clipboard,
  onCopy,
  onCut,
  onPaste,
  refreshTrigger,
  currentFilePath,
  onRefresh
}) {
  if (!folder) {
    return (
      <div className="w-64 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400 h-full">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
          <h2 className="font-semibold text-gray-200">Explorateur</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <FolderOpen size={48} className="mb-4 text-gray-600" />
          <p className="text-center">Aucun dossier ouvert</p>
          <p className="text-xs text-center mt-2 text-gray-500">Ouvrez un dossier pour parcourir vos fichiers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400 h-full">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Dossier ouvert</div>

        <FolderNode
          path={folder}
          name={getNameFromPath(folder)}
          readDir={readDir}
          onOpenFile={onOpenFile}
          onCreateItem={onCreateItem}
          onDeleteItem={onDeleteItem}
          onRenameItem={onRenameItem}
          clipboard={clipboard}
          onCopy={onCopy}
          onCut={onCut}
          onPaste={onPaste}
          refreshTrigger={refreshTrigger}
          currentFilePath={currentFilePath}
        />
      </div>

      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 bg-gray-800/50">
        <div className="flex justify-between"><span>Total:</span><span>~ fichiers</span></div>
        {clipboard && (
          <div className="mt-1 flex items-center gap-1">
            <span className="truncate">
              {clipboard.operation === 'copy' ? 'Copier : ' : 'Déplacer : '}
              {clipboard.sourcePath.split('/').pop()}
            </span>
          </div>
        )}
        <div className="mt-2 flex justify-between">
          <button onClick={onRefresh} className="text-xs text-gray-300 hover:text-white">Rafraîchir</button>
        </div>
      </div>
    </div>
  );
}
