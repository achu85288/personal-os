// Personal OS — tiny public service worker
// Handles Web Push with action buttons Done / Snooze / Drop

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data ? event.data.text() : "Personal OS", body: "" };
  }
  const title = data.title || "Personal OS";
  const options = {
    body: data.body || "You have an open loop waiting.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || data.item_id || "pos-nag",
    data: { item_id: data.item_id, url: data.url || "/", actions: data.actions },
    actions: [
      { action: "done", title: "Done" },
      { action: "snooze", title: "Snooze 1h" },
      { action: "drop", title: "Drop" },
    ],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  const itemId = data.item_id;

  if (action && itemId) {
    // POST to /push/action — verified by server
    event.waitUntil(
      fetch("/api/push/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, action }),
      }).catch(() => {})
    );
    return;
  }

  // default click -> open app
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.includes(self.location.origin) && "focus" in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(data.url || "/");
    })
  );
});

self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
