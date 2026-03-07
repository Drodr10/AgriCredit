"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function SyncUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasSynced.current) {
      hasSynced.current = true;
      fetch("/api/farmers/me")
        .then((res) => {
          if (!res.ok) {
            console.error("Failed to sync user with backend");
          } else {
            console.log("User synced successfully");
          }
        })
        .catch(console.error);
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
