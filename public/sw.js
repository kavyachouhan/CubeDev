// Service Worker for CubeDev Push Notifications
const CACHE_NAME = "cubedev-push-v1";

// Install event - cache necessary assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("cubedev-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Push event - receive push notifications from server
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {
    title: "CubeDev",
    body: "You have algorithms due for review!",
    icon: "/cubedev_logo.png",
    badge: "/cubedev_logo.png",
    tag: "algorithm-due",
    url: "/cube-lab/algorithm-trainer/practice",
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      console.error("[SW] Failed to parse push data:", e);
      // Try text format
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/cubedev_logo.png",
    badge: data.badge || "/cubedev_logo.png",
    tag: data.tag || "cubedev-notification",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/cube-lab/algorithm-trainer/practice",
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: "practice",
        title: "Practice Now",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  const action = event.action;
  const url =
    event.notification.data?.url || "/cube-lab/algorithm-trainer/practice";

  if (action === "dismiss") {
    return;
  }

  // Get the origin from the first client or use relative URL
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window and navigate to the URL
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            return client.navigate(url).then(() => client.focus());
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

// Notification close event (user dismissed without clicking)
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event);
});

// Background sync (for offline support - future enhancement)
self.addEventListener("sync", (event) => {
  console.log("[SW] Sync event:", event.tag);
});

// Message from main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
