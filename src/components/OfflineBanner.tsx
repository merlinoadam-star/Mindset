import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a slim amber banner at the top of the screen when the device
 * loses network. The app continues working from cached content (via
 * the service worker) but users see fresher-looking data once they
 * reconnect. No action required from them.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-2 shadow-md">
      <WifiOff size={12} />
      <span>You&apos;re offline — changes will sync when you reconnect</span>
    </div>
  );
}
