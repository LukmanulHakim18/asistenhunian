"use server";

import { profileApi } from "@/lib/api/profile";
import { authApi } from "@/lib/api/auth";
import { revalidatePath } from "next/cache";
import type { UpdateProfileRequest, ChangePasswordRequest } from "@/lib/api/types";

export async function updateProfileAction(data: UpdateProfileRequest) {
  await profileApi.update(data);
  revalidatePath("/profile");
}

export async function changePasswordAction(data: ChangePasswordRequest) {
  await authApi.changePassword(data);
}
