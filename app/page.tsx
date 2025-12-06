import fs from 'node:fs/promises';
import path from 'node:path';

import type { Prisma } from '@/lib/generated/prisma/client';
import { HomePageContent } from '@/components/home-page-content';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/supabase/server';

export const revalidate = 0;

type SearchParams = {
  v?: string | string[];
  courseId?: string | string[];
  promptSave?: string | string[];
  courseSaved?: string | string[];
};

type VideoWithProgress = Prisma.VideoGetPayload<{
  include: { progress: { select: { completed: true } } };
}>;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const courseIdParam = parseId(resolvedSearchParams?.courseId);
  const courseSaved = isParamTrue(resolvedSearchParams?.courseSaved);

  let rawVideos: VideoWithProgress[] = [];

  if (user) {
    if (courseIdParam) {
      // 1. COURSE CONTEXT
      const course = await prisma.course.findUnique({
        where: { id: courseIdParam, ownerId: user.id },
        include: {
          items: {
            include: {
              video: {
                include: {
                  progress: {
                    where: { userId: user.id },
                    select: { completed: true },
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
      });

      if (course) {
        rawVideos = course.items.map((item) => item.video);
      }
    } else {
      // 2. INBOX CONTEXT (Only unassigned videos)
      rawVideos = await prisma.video.findMany({
        where: {
          ownerId: user.id,
          courseItems: {
            none: {},
          },
        },
        include: {
          progress: {
            where: { userId: user.id },
            select: { completed: true },
          },
        },
      });
    }
  }

  const canSync = Boolean(process.env.VIDEO_ROOT) && Boolean(user);
  const hasSavedCourses = user
    ? (await prisma.course.count({ where: { ownerId: user.id } })) > 0
    : false;
  const showImportButton = true;

  const withSections = await Promise.all(
    rawVideos.map(async (video) => {
      const exists = await fileExists(video.path);
      if (!exists) return null;

      let section = 'Library';

      if (video.filename.startsWith('jellyfin|')) {
        const parts = video.filename.split('|');
        if (parts.length >= 2) {
          section = parts[1];
        }
      } else {
        section = deriveLocalSection(video.path);
      }

      return {
        ...video,
        completed: user ? video.progress?.[0]?.completed ?? false : false,
        duration: video.duration ?? null,
        section,
      };
    })
  );

  const videos = withSections
    .filter((video): video is NonNullable<(typeof withSections)[number]> =>
      Boolean(video)
    )
    .sort((a, b) => {
      const sectionCompare = (a.section || '').localeCompare(
        b.section || '',
        undefined,
        { numeric: true }
      );
      if (sectionCompare !== 0) return sectionCompare;
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });

  const requestedId = parseId(resolvedSearchParams?.v);
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

  // Logic: Show clear button ONLY if we are in Inbox Mode (no courseId) AND there are videos to clear
  const showClearLibraryButton = !courseIdParam && videos.length > 0;

  return (
    <HomePageContent
      videos={videos}
      currentId={currentId}
      currentVideo={currentVideo}
      prevId={prevId}
      nextId={nextId}
      showSyncButton={canSync}
      showImportButton={showImportButton}
      promptSave={resolvedSearchParams?.promptSave === '1'}
      courseSaved={courseSaved}
      hasSavedCourses={hasSavedCourses}
      showClearLibraryButton={showClearLibraryButton} // Pass the calculated flag
      user={
        user
          ? {
              id: user.id,
              email: user.email ?? undefined,
            }
          : null
      }
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

function parseId(value?: string | string[]) {
  const asString = Array.isArray(value) ? value[0] : value;
  if (!asString) return undefined;
  const parsed = Number(asString);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function isParamTrue(value?: string | string[]) {
  const asString = Array.isArray(value) ? value[0] : value;
  return asString === '1' || asString === 'true';
}
