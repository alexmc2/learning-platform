import path from 'node:path'

// Common container formats supported by the player and streaming route.
const VIDEO_MIME_TYPES = new Map<string, string>([
  ['.mp4', 'video/mp4'],
  ['.m4v', 'video/x-m4v'],
  ['.mkv', 'video/x-matroska'],
  ['.webm', 'video/webm'],
  ['.mov', 'video/quicktime'],
  ['.avi', 'video/x-msvideo'],
  ['.wmv', 'video/x-ms-wmv'],
  ['.flv', 'video/x-flv'],
  ['.ts', 'video/mp2t'],
  ['.m2ts', 'video/mp2t'],
  ['.mts', 'video/mp2t'],
  ['.mpg', 'video/mpeg'],
  ['.mpeg', 'video/mpeg'],
  ['.ogv', 'video/ogg'],
  ['.3gp', 'video/3gpp'],
  ['.3g2', 'video/3gpp2'],
  ['.f4v', 'video/x-f4v'],
])

const FALLBACK_VIDEO_MIME = 'application/octet-stream'

export const VIDEO_EXTENSIONS = new Set(VIDEO_MIME_TYPES.keys())

export function isVideoPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  return VIDEO_EXTENSIONS.has(ext)
}

export function getVideoMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  return VIDEO_MIME_TYPES.get(ext) ?? FALLBACK_VIDEO_MIME
}
