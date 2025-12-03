import fs from "node:fs/promises";
import path from "node:path";

import { HomePageContent } from "@/components/home-page-content";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

type SearchParams = {
  v?: string | string[];
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const rawVideos = await prisma.video.findMany({
    orderBy: [{ path: "asc" }],
  });

  const withSections = await Promise.all(
    rawVideos.map(async (video) => {
      const exists = await fileExists(video.path);
      if (!exists) return null;
      return {
        ...video,
        section: deriveSection(video.path),
      };
    }),
  );

  const videos = withSections.filter(
    (video): video is NonNullable<(typeof withSections)[number]> => Boolean(video),
  );

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

function deriveSection(filePath: string) {
  const parts = filePath.split(path.sep).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return "Library";
}

async function fileExists(filePath: string) {
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
