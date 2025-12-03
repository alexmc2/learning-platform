"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { VIDEO_ROOT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const VIDEO_EXTENSIONS = new Set([".mp4"]);

function titleFromFilename(filename: string) {
  const base = path.parse(filename).name;
  const normalized = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized
    .split(" ")
    .map((word) =>
      word.length > 0
        ? `${word[0].toUpperCase()}${word.slice(1)}`
        : word,
    )
    .join(" ");
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
    }),
  );
  return files.flat();
}

export type SyncResult = {
  ok: boolean;
  message: string | null;
};

export async function syncLibrary(
  _prevState?: SyncResult,
  _formData?: FormData,
): Promise<SyncResult> {
  try {
    void _prevState;
    void _formData;
    const root = path.resolve(VIDEO_ROOT);
    const stats = await fs.stat(root).catch(() => null);

    if (!stats || !stats.isDirectory()) {
      return {
        ok: false,
        message: `Video root "${root}" is missing or not a directory.`,
      };
    }

    const videoPaths = await collectVideoFiles(root);
    const foundFilenames = new Set(
      videoPaths.map((absolutePath) => path.basename(absolutePath)),
    );

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
      }),
    );

    const existing = await prisma.video.findMany({ select: { filename: true } });
    const missingFilenames = existing
      .map((video) => video.filename)
      .filter((filename) => !foundFilenames.has(filename));

    let removedCount = 0;
    if (missingFilenames.length > 0) {
      removedCount = missingFilenames.length;
      await prisma.video.deleteMany({
        where: { filename: { in: missingFilenames } },
      });
    }

    revalidatePath("/");

    if (videoPaths.length === 0 && removedCount === 0) {
      return {
        ok: false,
        message: `No videos found in "${root}".`,
      };
    }

    const removalNote =
      removedCount > 0
        ? `; removed ${removedCount} missing entr${removedCount === 1 ? "y" : "ies"}`
        : "";

    return {
      ok: true,
      message: `Synced ${videoPaths.length} video${videoPaths.length === 1 ? "" : "s"}${removalNote}.`,
    };
  } catch (error) {
    const fallback =
      error instanceof Error ? error.message : "Failed to sync the video library.";
    return { ok: false, message: fallback };
  }
}
