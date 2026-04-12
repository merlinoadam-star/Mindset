import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { AuthProvider } from "./lib/authContext";
import Layout from "./components/Layout";
import RewardToast from "./components/RewardToast";
import AuthPage from "./pages/Auth";
import ConnectionsPage from "./pages/Connections";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import HabitsPage from "./pages/Habits";
import PracticePage from "./pages/Practice";
import MindsetPage from "./pages/Mindset";
import BadgesPage from "./pages/Badges";
import SettingsPage from "./pages/Settings";
import TriviaPage from "./pages/Trivia";
import ProfilePage from "./pages/Profile";
import MatchesPage from "./pages/Matches";
import VisualizePage from "./pages/Visualize";
import BreathePage from "./pages/Breathe";
import LessonsPage from "./pages/Lessons";
import WeeklyReviewPage from "./pages/WeeklyReview";
import PowerPhrasesPage from "./pages/PowerPhrases";
import ScenariosPage from "./pages/Scenarios";
import GamesPage from "./pages/Games";
import ReactionTapPage from "./pages/ReactionTap";
import FocusFlashPage from "./pages/FocusFlash";
import VideoLibraryPage from "./pages/VideoLibrary";
import OpponentsPage from "./pages/Opponents";
import VoicePersonasPage from "./pages/VoicePersonas";
import ExportReportPage from "./pages/ExportReport";

function AppShell() {
  const { state } = useStore();

  if (!state.profile) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="auth" element={<AuthPage />} />
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
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppShell />
        <RewardToast />
      </StoreProvider>
    </AuthProvider>
  );
}
