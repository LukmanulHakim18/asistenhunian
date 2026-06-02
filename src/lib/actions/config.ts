"use server";

import { adminApi } from "@/lib/api/admin";
import type { SetConfigRequest } from "@/lib/api/types";
import { revalidatePath } from "next/cache";

export async function setConfigAction(key: string, body: SetConfigRequest) {
  await adminApi.setConfig(key, body);
  revalidatePath("/admin/settings");
}
