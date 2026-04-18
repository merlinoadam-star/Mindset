import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/authContext";
import Layout from "./components/Layout";
import CoachLayout from "./components/CoachLayout";
import RewardToast from "./components/RewardToast";
import ErrorBoundary from "./components/ErrorBoundary";
import FeedbackFAB from "./components/FeedbackFAB";
import OfflineBanner from "./components/OfflineBanner";
import Confetti from "./components/Confetti";
import EasterEggs from "./components/EasterEggs";

// Eager — needed before any route renders
import Onboarding from "./pages/Onboarding";

// Lazy — each page loads on demand when the route is visited
const AuthPage = lazy(() => import("./pages/Auth"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const ConnectionsPage = lazy(() => import("./pages/Connections"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard"));
const AthleteViewPage = lazy(() => import("./pages/AthleteView"));
const FeedbackInboxPage = lazy(() => import("./pages/FeedbackInbox"));
const HabitsPage = lazy(() => import("./pages/Habits"));
const PracticePage = lazy(() => import("./pages/Practice"));
const MindsetPage = lazy(() => import("./pages/Mindset"));
const BadgesPage = lazy(() => import("./pages/Badges"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const TriviaPage = lazy(() => import("./pages/Trivia"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const MatchesPage = lazy(() => import("./pages/Matches"));
const VisualizePage = lazy(() => import("./pages/Visualize"));
const BreathePage = lazy(() => import("./pages/Breathe"));
const LessonsPage = lazy(() => import("./pages/Lessons"));
const WeeklyReviewPage = lazy(() => import("./pages/WeeklyReview"));
const PowerPhrasesPage = lazy(() => import("./pages/PowerPhrases"));
const ScenariosPage = lazy(() => import("./pages/Scenarios"));
const GamesPage = lazy(() => import("./pages/Games"));
const ReactionTapPage = lazy(() => import("./pages/ReactionTap"));
const FocusFlashPage = lazy(() => import("./pages/FocusFlash"));
const VideoLibraryPage = lazy(() => import("./pages/VideoLibrary"));
const OpponentsPage = lazy(() => import("./pages/Opponents"));
const VoicePersonasPage = lazy(() => import("./pages/VoicePersonas"));
const ExportReportPage = lazy(() => import("./pages/ExportReport"));
const ProgressPage = lazy(() => import("./pages/Progress"));
const AskCoachPage = lazy(() => import("./pages/AskCoach"));
const AppFeedbackPage = lazy(() => import("./pages/AppFeedback"));
const SeasonGoalsPage = lazy(() => import("./pages/SeasonGoals"));
const MatchDayPage = lazy(() => import("./pages/MatchDay"));
const HighlightReelPage = lazy(() => import("./pages/HighlightReel"));
const RecordsPage = lazy(() => import("./pages/Records"));
const TimelinePage = lazy(() => import("./pages/Timeline"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm text-slate-400">Loading...</div>
    </div>
  );
}

function AppShell() {
  const { state } = useStore();
  const { account, loading: authLoading } = useAuth();

  // Password-reset deep link — users land here from the email link with
  // a recovery token in the URL hash. We bypass all the normal auth /
  // profile gating and let them set a new password. After success the
  // page does a hard redirect to "/" to exit this mode.
  if (
    typeof window !== "undefined" &&
    window.location.pathname === "/reset-password"
  ) {
    return (
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/reset-password" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
  }

  // Still waiting on initial session resolution
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  // --- Coach / Parent routing ---
  // A signed-in coach or parent never goes through athlete onboarding.
  // They get their own dashboard with a roster of connected athletes.
  if (account && (account.role === "coach" || account.role === "parent")) {
    return (
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="auth" element={<AuthPage />} />
            <Route element={<CoachLayout />}>
              <Route index element={<CoachDashboard />} />
              <Route path="athlete/:id" element={<AthleteViewPage />} />
              <Route path="connections" element={<ConnectionsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="app-feedback" element={<AppFeedbackPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
  }

  // --- Athlete routing ---
  // (Also the default for anyone NOT signed in — Phase 1 continues working.)
  if (!state.profile) {
    // Allow direct navigation to /auth so returning users can sign in
    // without being forced through onboarding first.
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/auth"
    ) {
      return (
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      );
    }
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="auth" element={<AuthPage />} />
          <Route path="match-day" element={<MatchDayPage />} />
          <Route path="highlight-reel" element={<HighlightReelPage />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="mindset" element={<MindsetPage />} />
            <Route path="badges" element={<BadgesPage />} />
            <Route path="trivia" element={<TriviaPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="visualize" element={<VisualizePage />} />
            <Route path="breathe" element={<BreathePage />} />
            <Route path="lessons" element={<LessonsPage />} />
            <Route path="review" element={<WeeklyReviewPage />} />
            <Route path="phrases" element={<PowerPhrasesPage />} />
            <Route path="scenarios" element={<ScenariosPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="games/reaction" element={<ReactionTapPage />} />
            <Route path="games/flash" element={<FocusFlashPage />} />
            <Route path="videos" element={<VideoLibraryPage />} />
            <Route path="opponents" element={<OpponentsPage />} />
            <Route path="voice" element={<VoicePersonasPage />} />
            <Route path="export" element={<ExportReportPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="ask" element={<AskCoachPage />} />
          <Route path="app-feedback" element={<AppFeedbackPage />} />
            <Route path="season-goals" element={<SeasonGoalsPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="feedback" element={<FeedbackInboxPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <OfflineBanner />
          <AppShell />
          <RewardToast />
          <Confetti />
          <EasterEggs />
          <FeedbackFAB />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
