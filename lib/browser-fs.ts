export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterable<FileSystemHandle>;
  queryPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
  requestPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
}

export async function scanDirectoryForManifest(
  dirHandle: FileSystemDirectoryHandle,
  rootPath: string, // The "virtual" root path to prepend, e.g. /home/user/videos
  pathSegments: string[] = []
): Promise<{ path: string; title: string }[]> {
  const results: { path: string; title: string }[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      // Check formatted extensions if desired, or just all files
      const isVideo = /\.(mp4|mkv|webm|mov|avi|m4v)$/i.test(entry.name);
      if (isVideo) {
        // Construct the full "virtual" absolute path
        // rootPath ends with / usually? or we handle it.
        // pathSegments are the relative folders from the pick root.

        const relativePath = [...pathSegments, entry.name].join('/');
        // Clean path joining
        const fullPath = `${rootPath.replace(/\/+$/, '')}/${relativePath}`;

        // Smart title generation
        const title = entry.name
          .replace(/\.(mp4|mkv|webm|mov|avi|m4v)$/i, '')
          .replace(/[_-]+/g, ' ')
          .trim();

        results.push({ path: fullPath, title });
      }
    } else if (entry.kind === 'directory') {
      const subResults = await scanDirectoryForManifest(
        entry as FileSystemDirectoryHandle,
        rootPath,
        [...pathSegments, entry.name]
      );
      results.push(...subResults);
    }
  }
  return results;
}
