"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/supabase/server";

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
