'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';

import { VIDEO_ROOT } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/supabase/server';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm']);

function titleFromFilename(filename: string) {
  const base = path.parse(filename).name;
  const normalized = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized
    .split(' ')
    .map((word) =>
      word.length > 0 ? `${word[0].toUpperCase()}${word.slice(1)}` : word
    )
    .join(' ');
}

async function collectVideoFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectVideoFiles(fullPath);
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (VIDEO_EXTENSIONS.has(ext)) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

function localKeyForPath(absolutePath: string) {
  // Stable per file on disk to avoid collisions between different courses/folders.
  return `local|${path.resolve(absolutePath)}`;
}

export type SyncResult = {
  ok: boolean;
  message: string | null;
};

export async function clearAllVideos() {
  const user = await requireUser();
  const deleted = await prisma.video.deleteMany({
    where: { ownerId: user.id },
  });
  revalidatePath('/');
  revalidatePath('/courses');
  console.log(`Cleared ${deleted.count} videos from library`);
}

export async function syncLibrary(
  _prevState: SyncResult,
  formData: FormData
): Promise<SyncResult> {
  try {
    console.log('--- SYNC STARTED ---');
    const user = await requireUser();

    const mode = formData.get('mode') === 'remove' ? 'remove' : 'scan';
    const replaceExisting = formData.get('replace') === 'true';
    const customPath = formData.get('path') as string | null;
    const usedCustomPath = Boolean(customPath?.trim());
    const rawRoot = usedCustomPath ? customPath!.trim() : VIDEO_ROOT;

    if (!rawRoot) {
      return {
        ok: false,
        message:
          'Please provide a folder path when syncing, or set VIDEO_ROOT in your env.',
      };
    }

    const root = path.resolve(rawRoot);

    console.log(`Scanning directory: "${root}"`);

    const stats = await fs.stat(root).catch(() => null);

    if (!stats || !stats.isDirectory()) {
      console.error('Directory not found or is not a folder.');
      return {
        ok: false,
        message: `Directory not found: "${root}"`,
      };
    }

    if (mode === 'remove') {
      const deleted = await prisma.video.deleteMany({
        where: {
          ownerId: user.id,
          path: { startsWith: root },
          NOT: { path: { startsWith: 'http' } },
        },
      });

      revalidatePath('/');
      revalidatePath('/courses');

      return {
        ok: true,
        message: `Removed ${deleted.count} video${
          deleted.count === 1 ? '' : 's'
        } under "${path.basename(root)}".`,
      };
    }

    const videoPaths = await collectVideoFiles(root);
    console.log(`Found ${videoPaths.length} files on disk.`);

    if (videoPaths.length > 0) {
      console.log('First file found:', videoPaths[0]);
    }

    const foundFilenames = new Set(
      videoPaths.map((absolutePath) => localKeyForPath(absolutePath))
    );
    const resolvedPaths = videoPaths.map((absolutePath) =>
      path.resolve(absolutePath)
    );

    // 2. Log before writing to DB
    console.log('Starting Database Upsert...');

    await Promise.all(
      videoPaths.map(async (absolutePath) => {
        const filename = localKeyForPath(absolutePath);
        const title = titleFromFilename(path.basename(absolutePath));

        await prisma.video.upsert({
          where: {
            ownerId_filename: {
              ownerId: user.id,
              filename,
            },
          },
          update: {
            path: absolutePath,
            title,
          },
          create: {
            ownerId: user.id,
            filename,
            title,
            path: absolutePath,
          },
        });
      })
    );

    console.log('Database Upsert Complete.');

    const existing = await prisma.video.findMany({
      where: { ownerId: user.id },
      select: { filename: true, path: true },
    });

    // 3. Check what's currently in the DB
    console.log(`Total videos currently in DB: ${existing.length}`);

    // Clean up any stale rows pointing at the same paths but using old keys.
    if (resolvedPaths.length > 0) {
      await prisma.video.deleteMany({
        where: {
          ownerId: user.id,
          path: { in: resolvedPaths },
          filename: { notIn: Array.from(foundFilenames) },
        },
      });
    }

    // Only consider removals for local files inside the scanned root.
    let removedCount = 0;
    if (replaceExisting) {
      const removable = existing.filter((video) => {
        if (video.path.startsWith('http')) return false;
        const resolved = path.resolve(video.path);
        return resolved === root || resolved.startsWith(`${root}${path.sep}`);
      });

      const missingFilenames = removable
        .map((video) => video.filename)
        .filter((filename) => !foundFilenames.has(filename));

      if (missingFilenames.length > 0) {
        removedCount = missingFilenames.length;
        console.log(`Removing ${removedCount} missing videos from DB.`);
        await prisma.video.deleteMany({
          where: { ownerId: user.id, filename: { in: missingFilenames } },
        });
      }
    } else {
      console.log('Replace not selected; keeping existing local entries.');
    }

    revalidatePath('/');
    revalidatePath('/courses');
    console.log('--- SYNC FINISHED SUCCESSFULLY ---');

    if (videoPaths.length === 0 && removedCount === 0) {
      return {
        ok: false,
        message: `No videos found in "${root}".`,
      };
    }

    const removalNote =
      removedCount > 0
        ? `; removed ${removedCount} missing entr${
            removedCount === 1 ? 'y' : 'ies'
          }`
        : '';

    return {
      ok: true,
      message: `Synced ${videoPaths.length} video${
        videoPaths.length === 1 ? '' : 's'
      } from "${path.basename(root)}"${removalNote}.`,
    };
  } catch (error) {
    console.error('SYNC ERROR:', error);
    const fallback =
      error instanceof Error
        ? error.message
        : 'Failed to sync the video library.';
    return { ok: false, message: fallback };
  }
}

interface JellyfinVideo {
  id: string;
  title: string;
  sourceUrl: string;
  duration?: number | null;
  section?: string;
}

export async function importJellyfinVideos(videos: JellyfinVideo[]) {
  console.log('--- IMPORTING JELLYFIN VIDEOS ---');

  try {
    const user = await requireUser();
    if (videos.length === 0) {
      return { ok: false };
    }

    const parseServer = (id: string) => {
      const idx = id.indexOf('|');
      return idx === -1 ? null : id.slice(0, idx);
    };

    const serverUrl = parseServer(videos[0].id);
    const keepKeys = new Set<string>();
    const paths: string[] = [];
    const keepKeyList = () => Array.from(keepKeys);

    for (const video of videos) {
      const sectionName = video.section || 'General';
      const uniqueKey = `jellyfin|${sectionName}|${video.id}`;
      keepKeys.add(uniqueKey);
      paths.push(video.sourceUrl);

      await prisma.video.upsert({
        where: {
          ownerId_filename: {
            ownerId: user.id,
            filename: uniqueKey,
          },
        },
        update: {
          path: video.sourceUrl,
          title: video.title,
          duration: video.duration ? Math.round(video.duration) : null,
        },
        create: {
          ownerId: user.id,
          filename: uniqueKey,
          path: video.sourceUrl,
          title: video.title,
          duration: video.duration ? Math.round(video.duration) : null,
        },
      });
    }

    const keepKeysArray = keepKeyList();

    // Remove stale rows for this Jellyfin server that are no longer present.
    if (serverUrl) {
      const prefix = `jellyfin|${serverUrl}|`;
      await prisma.video.deleteMany({
        where: {
          ownerId: user.id,
          AND: [
            { filename: { startsWith: prefix } },
            { filename: { notIn: keepKeysArray } },
          ],
        },
      });
    }

    // Remove stale rows for the same items if the key format changed.
    if (paths.length > 0) {
      await prisma.video.deleteMany({
        where: {
          ownerId: user.id,
          path: { in: paths },
          filename: { notIn: keepKeysArray },
        },
      });
    }

    revalidatePath('/');
    revalidatePath('/courses');
    return { ok: true };
  } catch (error) {
    console.error('Jellyfin Import Error:', error);
    return { ok: false };
  }
}
