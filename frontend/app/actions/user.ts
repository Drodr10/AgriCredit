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
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;

  console.log("[SERVER ACTION] Updating user metadata for:", userId);
  await client.users.updateUser(userId, {
    publicMetadata: {
      role,
    },
  });

  if (email) {
    console.log("[SERVER ACTION] Syncing role to backend with email:", email);
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/users/me/role?clerk_id=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email }),
      });
      if (!res.ok) {
         console.error("[SERVER ACTION] Backend sync failed", await res.text());
      }
    } catch (e) {
      console.error("[SERVER ACTION] Failed to fetch backend", e);
    }
  }

  console.log("[SERVER ACTION] Update successful");
  return { success: true };
}
