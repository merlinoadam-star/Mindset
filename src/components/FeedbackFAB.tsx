import { Bug } from "lucide-react";
import { useAuth } from "../lib/authContext";

/**
 * Floating action button for quick bug/idea reporting during testing.
 * Appears in the bottom-right corner on every page for signed-in users.
 * Links to /app-feedback.
 */
export default function FeedbackFAB() {
  const { configured } = useAuth();
  if (!configured) return null;

  return (
    <a
      href="/app-feedback"
      aria-label="Report a bug or idea"
      className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition active:scale-90"
    >
      <Bug size={20} />
    </a>
  );
}
