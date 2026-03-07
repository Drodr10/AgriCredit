"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function setRole(role: "farmer" | "lender") {
  console.log("[SERVER ACTION] setRole called with:", role);
  const { userId } = await auth();

  if (!userId) {
    console.error("[SERVER ACTION] Not logged in");
    throw new Error("Not logged in");
  }

  const client = await clerkClient();

  console.log("[SERVER ACTION] Updating user metadata for:", userId);
  await client.users.updateUser(userId, {
    publicMetadata: {
      role,
    },
  });

  console.log("[SERVER ACTION] Update successful");
  return { success: true };
}
