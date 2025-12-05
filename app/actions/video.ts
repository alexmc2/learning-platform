"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/supabase/server";

type BulkCompletionResult = {
  ok: boolean;
  message?: string;
};

export async function setVideoCompletion(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("videoId"));
  const completed = formData.get("completed") === "true";

  if (!Number.isInteger(id)) {
    throw new Error("Invalid video id");
  }

  const ownedVideo = await prisma.video.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true },
  });

  if (!ownedVideo) {
    throw new Error("Video not found");
  }

  await prisma.videoProgress.upsert({
    where: {
      videoId_userId: {
        videoId: id,
        userId: user.id,
      },
    },
    update: { completed },
    create: {
      videoId: id,
      userId: user.id,
      completed,
    },
  });

  revalidatePath("/");
  revalidatePath("/courses");
}

export async function setVideosCompletion(
  formData: FormData
): Promise<BulkCompletionResult> {
  const user = await requireUser();
  const rawIds = formData.get("videoIds");
  const completed = formData.get("completed") === "true";

  const ids = parseIds(rawIds);

  if (ids.length === 0) {
    return { ok: false, message: "No videos provided." };
  }

  const owned = await prisma.video.findMany({
    where: { ownerId: user.id, id: { in: ids } },
    select: { id: true },
  });

  const ownedIds = new Set(owned.map((video) => video.id));
  const missing = ids.filter((id) => !ownedIds.has(id));

  if (missing.length > 0) {
    return { ok: false, message: "Some videos were not found." };
  }

  await Promise.all(
    ids.map((id) =>
      prisma.videoProgress.upsert({
        where: {
          videoId_userId: {
            videoId: id,
            userId: user.id,
          },
        },
        update: { completed },
        create: {
          videoId: id,
          userId: user.id,
          completed,
        },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/courses");

  return { ok: true };
}

function parseIds(value: FormDataEntryValue | null): number[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isInteger);
  }

  try {
    const parsed = JSON.parse(value.toString()) as number[];
    return Array.isArray(parsed)
      ? parsed.map(Number).filter(Number.isInteger)
      : [];
  } catch {
    return [];
  }
}
