import { useEffect, useCallback } from "react";
import { notificationAPI } from "../services/api";
import { getUsername } from "../services/auth";

const MAX_CACHE = 200;
const MAX_ROUNDS = 5;

const keys = () => {
  const u = getUsername() || "user";
  return { cache: `notif_cache_${u}`, since: `notif_sync_since_${u}` };
};

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

// Offline hone par popup yahan se alerts padh sakta hai
export const getCachedNotifications = () => read(keys().cache, []);

export const syncNotifications = async () => {
  const k = keys();
  let since = read(k.since, null);
  let cache = read(k.cache, []);

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const data = await notificationAPI.syncNotifications(since);
    const incoming = data.notifications || [];
    const resolved = new Set(data.resolved_ids || []);

    const map = new Map(cache.map((n) => [n.id, n]));
    incoming.forEach((n) => map.set(n.id, n));
    resolved.forEach((id) => map.delete(id));
    cache = Array.from(map.values())
      .filter((n) => !n.is_resolved)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, MAX_CACHE);
    write(k.cache, cache);

    if (incoming.length > 0) {
      await notificationAPI.ackSync(incoming.map((n) => n.id));
    }

    if (data.has_more && incoming.length > 0) {
      since = incoming[incoming.length - 1].created_at;
    } else {
      write(k.since, data.server_time);
      break;
    }
  }

  window.dispatchEvent(new Event("notifications-synced"));
};

// MasterLayout mein ek baar call karo: login/page load par aur net wapas aane par sync
const useNotificationSync = () => {
  const run = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      await syncNotifications();
    } catch (error) {
      console.error("Notification sync failed:", error);
    }
  }, []);

  useEffect(() => {
    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [run]);
};

export default useNotificationSync;
