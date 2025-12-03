import fs from 'node:fs/promises';
import path from 'node:path';

import { HomePageContent } from '@/components/home-page-content';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

type SearchParams = {
  v?: string | string[];
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const rawVideos = await prisma.video.findMany(); // Remove orderBy from here

  const withSections = await Promise.all(
    rawVideos.map(async (video) => {
      const exists = await fileExists(video.path);
      if (!exists) return null;

      // 1. EXTRACT SECTION LOGIC
      let section = 'Library';

      // If it's a Jellyfin video (stored as "jellyfin|SECTION|TITLE")
      if (video.filename.startsWith('jellyfin|')) {
        const parts = video.filename.split('|');
        if (parts.length >= 2) {
          section = parts[1]; // Recover the section name
        }
      } else {
        // Local file logic
        section = deriveLocalSection(video.path);
      }

      return {
        ...video,
        section,
      };
    })
  );

  // 2. FILTER & SORT
  const videos = withSections
    .filter((video): video is NonNullable<(typeof withSections)[number]> =>
      Boolean(video)
    )
    .sort((a, b) => {
      // Sort by Section first
      const sectionCompare = (a.section || '').localeCompare(
        b.section || '',
        undefined,
        { numeric: true }
      );
      if (sectionCompare !== 0) return sectionCompare;

      // Then sort by Title (numeric aware, so "Lesson 2" comes before "Lesson 10")
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedId = parseVideoId(resolvedSearchParams?.v);
  const currentId = requestedId ?? videos[0]?.id;
  const currentIndex = videos.findIndex((video) => video.id === currentId);
  const currentVideo = currentIndex >= 0 ? videos[currentIndex] : null;
  const prevId =
    currentIndex > 0 && videos[currentIndex - 1]
      ? videos[currentIndex - 1].id
      : undefined;
  const nextId =
    currentIndex >= 0 && videos[currentIndex + 1]
      ? videos[currentIndex + 1].id
      : undefined;

  return (
    <HomePageContent
      videos={videos}
      currentId={currentId}
      currentVideo={currentVideo}
      prevId={prevId}
      nextId={nextId}
    />
  );
}

function deriveLocalSection(filePath: string) {
  const parts = filePath.split(path.sep).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return 'Library';
}

async function fileExists(filePath: string) {
  if (filePath.startsWith('http')) return true;
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseVideoId(value?: string | string[]) {
  const asString = Array.isArray(value) ? value[0] : value;
  if (!asString) return undefined;
  const parsed = Number(asString);
  return Number.isInteger(parsed) ? parsed : undefined;
}
