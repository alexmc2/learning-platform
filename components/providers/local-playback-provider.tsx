'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface LocalPlaybackContextType {
  isLinked: boolean;
  linkFolder: () => Promise<void>;
  getFileBlobUrl: (videoPath: string) => Promise<string | null>;
  permissionGranted: boolean;
}

const LocalPlaybackContext = createContext<LocalPlaybackContextType>({
  isLinked: false,
  linkFolder: async () => {},
  getFileBlobUrl: async () => null,
  permissionGranted: false,
});

export function useLocalPlayback() {
  return useContext(LocalPlaybackContext);
}

// Minimal type definitions for File System Access API
// to avoid "Property does not exist" errors
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterable<FileSystemHandle>;
  queryPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
  requestPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
}

// Helper to scan directory recursively
async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  pathSegments: string[] = []
): Promise<Map<string, FileSystemFileHandle>> {
  const fileMap = new Map<string, FileSystemFileHandle>();

  // Use 'any' cast if necessary or rely on the interface above
  // The 'values()' method returns an iterator of handles.
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const fileEntry = entry as FileSystemFileHandle;
      const relativePath = [...pathSegments, entry.name].join('/');
      fileMap.set(relativePath, fileEntry);

      if (!fileMap.has(entry.name)) {
        fileMap.set(entry.name, fileEntry);
      }
    } else if (entry.kind === 'directory') {
      // Recursive call
      const dirEntry = entry as FileSystemDirectoryHandle;
      const subMap = await scanDirectory(dirEntry, [
        ...pathSegments,
        entry.name,
      ]);
      subMap.forEach((handle, key) => fileMap.set(key, handle));
    }
  }
  return fileMap;
}

export function LocalPlaybackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rootHandle, setRootHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [fileMap, setFileMap] = useState<Map<string, FileSystemFileHandle>>(
    new Map()
  );
  const [permissionGranted, setPermissionGranted] = useState(false);

  const linkFolder = useCallback(async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast.error('Your browser does not support local file access.');
        return;
      }

      // @ts-expect-error - showDirectoryPicker is experimental
      const handle = await window.showDirectoryPicker();
      if (!handle) return; // cancelled

      const dirHandle = handle as FileSystemDirectoryHandle;

      const perm = await dirHandle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        const request = await dirHandle.requestPermission({ mode: 'read' });
        if (request !== 'granted') return;
      }

      setPermissionGranted(true);
      setRootHandle(dirHandle);
      toast.info('Scanning local files...');

      const map = await scanDirectory(dirHandle);
      setFileMap(map);
      toast.success(`Found ${map.size} files locally.`);
    } catch (err) {
      console.error('Failed to link folder', err);
      toast.error('Failed to link local folder.');
    }
  }, []);

  const getFileBlobUrl = useCallback(
    async (videoPath: string) => {
      if (fileMap.size === 0) return null;

      // Normalizing video path to try and find a match
      // videoPath could be "/home/alex/projects/learning/videos/course1/intro.mp4"

      // Strategy 1: Exact filename match
      const filename = videoPath.split(/[/\\]/).pop();
      if (!filename) return null;

      let handle = fileMap.get(filename);

      // Strategy 2: If we have multiple files with same name, we might have collisions.
      // Ideally we check if the suffix matches.
      // Iterate over all keys that end with filename to find the best suffix match?
      // Optimization: The fileMap keys include relative paths like "course1/intro.mp4".

      // Let's try to match as much as possible from the end of the string
      // e.g. path ".../course1/intro.mp4" -> we check if map has "course1/intro.mp4"

      // Filter map for keys ending with filename
      // videoPath parts: ["home", "alex", "projects", "learning", "videos", "course1", "intro.mp4"]
      const parts = videoPath.split(/[/\\]/);

      // Try matching increasingly longer suffixes
      for (let i = parts.length - 1; i >= 0; i--) {
        const suffix = parts.slice(i).join('/');
        if (fileMap.has(suffix)) {
          handle = fileMap.get(suffix);
          // Prefer the longest match
          if (handle) break;
        }
      }

      if (!handle) return null;

      try {
        const file = await handle.getFile();
        return URL.createObjectURL(file);
      } catch (err) {
        console.error('Error reading file handle', err);
        return null;
      }
    },
    [fileMap]
  );

  return (
    <LocalPlaybackContext.Provider
      value={{
        isLinked: !!rootHandle,
        linkFolder,
        getFileBlobUrl,
        permissionGranted,
      }}
    >
      {children}
    </LocalPlaybackContext.Provider>
  );
}
