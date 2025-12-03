"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function setVideoCompletion(formData: FormData) {
  const id = Number(formData.get("videoId"));
  const completed = formData.get("completed") === "true";

  if (!Number.isInteger(id)) {
    throw new Error("Invalid video id");
  }

  await prisma.video.update({
    where: { id },
    data: { completed },
  });

  revalidatePath("/");
}
