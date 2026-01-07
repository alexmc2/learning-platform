'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/supabase/server';

export type ImportManifestState = {
  ok: boolean;
  message: string | null;
  count?: number;
};

export async function importVideoManifest(
  videos: { path: string; title: string }[]
): Promise<ImportManifestState> {
  try {
    const user = await requireUser();

    if (videos.length === 0) {
      return { ok: false, message: 'No videos provided to import.' };
    }

    // Helper to generate a consistent key, similar to sync.ts
    const localKeyForPath = (absolutePath: string) => `local|${absolutePath}`;

    let count = 0;

    for (const video of videos) {
      const filename = localKeyForPath(video.path);

      await prisma.video.upsert({
        where: {
          ownerId_filename: {
            ownerId: user.id,
            filename,
          },
        },
        update: {
          path: video.path,
          title: video.title,
        },
        create: {
          ownerId: user.id,
          filename,
          title: video.title,
          path: video.path,
        },
      });
      count++;
    }

    revalidatePath('/');
    revalidatePath('/courses');

    return {
      ok: true,
      message: `Successfully imported ${count} videos.`,
      count,
    };
  } catch (error) {
    console.error('Import Manifest Error:', error);
    return {
      ok: false,
      message: 'Failed to import videos.',
    };
  }
}
