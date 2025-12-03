'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';

import { VIDEO_ROOT } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

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

export type SyncResult = {
  ok: boolean;
  message: string | null;
};

export async function syncLibrary(
  _prevState: SyncResult,
  formData: FormData
): Promise<SyncResult> {
  try {
    console.log('--- SYNC STARTED ---');

    const customPath = formData.get('path') as string | null;
    const rawRoot = customPath?.trim() ? customPath.trim() : VIDEO_ROOT;
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

    const videoPaths = await collectVideoFiles(root);
    console.log(`Found ${videoPaths.length} files on disk.`);

    if (videoPaths.length > 0) {
      console.log('First file found:', videoPaths[0]);
    }

    const foundFilenames = new Set(
      videoPaths.map((absolutePath) => path.basename(absolutePath))
    );

    // 2. Log before writing to DB
    console.log('Starting Database Upsert...');

    await Promise.all(
      videoPaths.map(async (absolutePath) => {
        const filename = path.basename(absolutePath);
        const title = titleFromFilename(filename);

        await prisma.video.upsert({
          where: { filename },
          update: {
            path: absolutePath,
            title,
          },
          create: {
            filename,
            title,
            path: absolutePath,
          },
        });
      })
    );

    console.log('Database Upsert Complete.');

    const existing = await prisma.video.findMany({
      select: { filename: true },
    });

    // 3. Check what's currently in the DB
    console.log(`Total videos currently in DB: ${existing.length}`);

    const missingFilenames = existing
      .map((video) => video.filename)
      .filter((filename) => !foundFilenames.has(filename));

    let removedCount = 0;
    if (missingFilenames.length > 0) {
      removedCount = missingFilenames.length;
      console.log(`Removing ${removedCount} missing videos from DB.`);
      await prisma.video.deleteMany({
        where: { filename: { in: missingFilenames } },
      });
    }

    revalidatePath('/');
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
  title: string;
  sourceUrl: string;
  duration?: number | null;
  completed?: boolean;
  section?: string;
}

export async function importJellyfinVideos(videos: JellyfinVideo[]) {
  console.log('--- IMPORTING JELLYFIN VIDEOS ---');

  try {
    for (const video of videos) {
      // Encode the section in the unique key so we can group videos without a schema change.
      const sectionName = video.section || 'General';
      const uniqueKey = `jellyfin|${sectionName}|${video.title}`;

      await prisma.video.upsert({
        where: { filename: uniqueKey },
        update: {
          path: video.sourceUrl,
          title: video.title,
          duration: video.duration ? Math.round(video.duration) : 0,
          completed: video.completed ?? false,
        },
        create: {
          filename: uniqueKey,
          path: video.sourceUrl,
          title: video.title,
          duration: video.duration ? Math.round(video.duration) : 0,
          completed: video.completed ?? false,
        },
      });
    }

    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    console.error('Jellyfin Import Error:', error);
    return { ok: false };
  }
}
