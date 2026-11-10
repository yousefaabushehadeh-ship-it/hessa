"use server";

import { revalidatePath } from "next/cache";
import { markAllRead } from "@/lib/notifications";
import { requireSession } from "@/lib/session";

export async function markNoticesRead(): Promise<void> {
  await markAllRead(await requireSession());
  revalidatePath("/", "layout");
}
