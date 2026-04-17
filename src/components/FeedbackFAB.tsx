import { useAuth } from "../lib/authContext";

/**
 * Floating ladybug button for quick bug/idea reporting during testing.
 * Appears in the bottom-right corner on every page.
 */
export default function FeedbackFAB() {
  const { configured } = useAuth();
  if (!configured) return null;

  return (
    <a
      href="/app-feedback"
      aria-label="Report a bug or idea"
      className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl flex items-center justify-center transition active:scale-90 border-2 border-black"
    >
      <svg
        viewBox="0 0 40 40"
        className="w-8 h-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head (black) */}
        <ellipse cx="20" cy="10" rx="7" ry="5" fill="#000" />
        {/* Body (red dome) */}
        <path
          d="M 6 20 Q 6 12 20 12 Q 34 12 34 20 L 34 28 Q 34 34 20 34 Q 6 34 6 28 Z"
          fill="#dc2626"
        />
        {/* Center wing divider */}
        <line x1="20" y1="12" x2="20" y2="34" stroke="#000" strokeWidth="1.5" />
        {/* Spots */}
        <circle cx="13" cy="18" r="2" fill="#000" />
        <circle cx="27" cy="18" r="2" fill="#000" />
        <circle cx="12" cy="26" r="1.8" fill="#000" />
        <circle cx="28" cy="26" r="1.8" fill="#000" />
        <circle cx="16" cy="30" r="1.5" fill="#000" />
        <circle cx="24" cy="30" r="1.5" fill="#000" />
        {/* Antennae */}
        <line x1="17" y1="6" x2="15" y2="3" stroke="#000" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="23" y1="6" x2="25" y2="3" stroke="#000" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="15" cy="3" r="1" fill="#000" />
        <circle cx="25" cy="3" r="1" fill="#000" />
        {/* Eyes (tiny white dots on head) */}
        <circle cx="17.5" cy="9" r="0.8" fill="#fff" />
        <circle cx="22.5" cy="9" r="0.8" fill="#fff" />
      </svg>
    </a>
  );
}
