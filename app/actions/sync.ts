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
    console.log('--- SYNC STARTED ---'); // <--- LOG 1: Start

    const customPath = formData.get('path') as string | null;
    const rawRoot = customPath?.trim() ? customPath.trim() : VIDEO_ROOT;
    const root = path.resolve(rawRoot);

    console.log(`Scanning directory: "${root}"`); // <--- LOG 2: Verify the path

    const stats = await fs.stat(root).catch(() => null);

    if (!stats || !stats.isDirectory()) {
      console.error('Directory not found or is not a folder.'); // <--- LOG 3: Path Error
      return {
        ok: false,
        message: `Directory not found: "${root}"`,
      };
    }

    // 1. Check if files are being found on the disk
    const videoPaths = await collectVideoFiles(root);
    console.log(`Found ${videoPaths.length} files on disk.`); // <--- LOG 4: File Count

    if (videoPaths.length > 0) {
      console.log('First file found:', videoPaths[0]); // <--- LOG 5: Sample file path
    }

    const foundFilenames = new Set(
      videoPaths.map((absolutePath) => path.basename(absolutePath))
    );

    // 2. Log before writing to DB
    console.log('Starting Database Upsert...'); // <--- LOG 6

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

    console.log('Database Upsert Complete.'); // <--- LOG 7

    const existing = await prisma.video.findMany({
      select: { filename: true },
    });

    // 3. Check what's currently in the DB
    console.log(`Total videos currently in DB: ${existing.length}`); // <--- LOG 8

    const missingFilenames = existing
      .map((video) => video.filename)
      .filter((filename) => !foundFilenames.has(filename));

    let removedCount = 0;
    if (missingFilenames.length > 0) {
      removedCount = missingFilenames.length;
      console.log(`Removing ${removedCount} missing videos from DB.`); // <--- LOG 9
      await prisma.video.deleteMany({
        where: { filename: { in: missingFilenames } },
      });
    }

    revalidatePath('/');
    console.log('--- SYNC FINISHED SUCCESSFULLY ---'); // <--- LOG 10

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
    console.error('SYNC ERROR:', error); // <--- LOG 11: Catch actual errors
    const fallback =
      error instanceof Error
        ? error.message
        : 'Failed to sync the video library.';
    return { ok: false, message: fallback };
  }
}