// src/utils/fsUtils.js
import React from "react";
import {
  FileText, FileCode, FileImage, FileArchive, FileVideo, FileAudio, Folder, FolderOpen
} from "lucide-react";

export const normalizePath = (p = "") => p.replace(/\\/g, "/").replace(/\/+$/, "");
export const getNameFromPath = (p = "") => {
  const np = normalizePath(p);
  return np.split("/").pop();
};
export const sortEntries = (a, b) => {
  if (a.isDir && !b.isDir) return -1;
  if (!a.isDir && b.isDir) return 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

export function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function getFileIcon(fileName, opts = {}) {
  const extension = (fileName.split(".").pop() || "").toLowerCase();

  if (["js", "jsx", "ts", "tsx", "html", "css", "json", "xml"].includes(extension)) {
    return React.createElement(FileCode, { size: 14, className: "text-blue-400" });
  }
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
    return React.createElement(FileImage, { size: 14, className: "text-green-400" });
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(extension)) {
    return React.createElement(FileArchive, { size: 14, className: "text-yellow-400" });
  }
  if (["mp4", "avi", "mov", "wmv", "mkv"].includes(extension)) {
    return React.createElement(FileVideo, { size: 14, className: "text-purple-400" });
  }
  if (["mp3", "wav", "flac", "aac"].includes(extension)) {
    return React.createElement(FileAudio, { size: 14, className: "text-pink-400" });
  }
  return React.createElement(FileText, { size: 14, className: "text-gray-400" });
}
